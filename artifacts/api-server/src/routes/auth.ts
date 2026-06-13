// @ts-nocheck
import { Router } from "express";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import {
  db, usersTable, passwordResetTokensTable, emailVerificationsTable, adminSettingsTable, masterAccountTable, eq,
} from "@workspace/db";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import { signToken, revokeToken, requireAuth } from "../middlewares/auth.js";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { sendPasswordResetEmail, sendEmailVerificationCode } from "../lib/email.js";

const router = Router();

const BCRYPT_ROUNDS     = 12;
const RESET_TTL_MS      = 60 * 60 * 1000;       // 1 hora
const VERIFY_TTL_MS     = 15 * 60 * 1000;       // 15 minutos

/* ── OAuth state store (in-memory, 10-min TTL) ────────────────────────── */
const oauthStates = new Map<string, number>();
setInterval(() => {
  const cutoff = Date.now() - 10 * 60 * 1000;
  for (const [k, ts] of oauthStates) if (ts < cutoff) oauthStates.delete(k);
}, 5 * 60 * 1000);

function buildCallbackUrl(req: any): string {
  const proto = (req.headers["x-forwarded-proto"] as string | undefined)?.split(",")[0]?.trim() ?? req.protocol ?? "https";
  const host  = (req.headers["x-forwarded-host"] as string | undefined) ?? (req.headers["host"] as string) ?? "";
  return `${proto}://${host}/api/auth/google/callback`;
}

function frontendOrigin(req: any): string {
  const proto = (req.headers["x-forwarded-proto"] as string | undefined)?.split(",")[0]?.trim() ?? req.protocol ?? "https";
  const host  = (req.headers["x-forwarded-host"] as string | undefined) ?? (req.headers["host"] as string) ?? "";
  return `${proto}://${host}`;
}

async function getGoogleConfig() {
  const row = await db.select().from(adminSettingsTable).where(eq(adminSettingsTable.key, "auth.google")).get();
  if (!row) return null;
  try { return JSON.parse(row.value); } catch { return null; }
}

/** POST /api/auth/register */
router.post("/register", validate(RegisterBody), async (req: any, res: any) => {
  try {
    const { id, name, email, password } = req.body as {
      id: string; name: string; email: string; password: string;
    };

    const existing = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .get();

    if (existing) {
      return res.status(409).json({ error: "email_taken", message: "Este e-mail já está em uso." });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const now = Date.now();

    await db.insert(usersTable).values({
      id,
      name,
      email,
      passwordHash,
      emailVerified: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Gerar e enviar código de verificação de email (6 dígitos)
    const code      = String(Math.floor(100000 + Math.random() * 900000));
    const verifyId  = `ev_${Date.now()}_${randomBytes(4).toString("hex")}`;
    await db.insert(emailVerificationsTable).values({
      id:        verifyId,
      userId:    id,
      email,
      code,
      expiresAt: now + VERIFY_TTL_MS,
      used:      0,
      createdAt: now,
    });

    const emailResult = await sendEmailVerificationCode({ to: email, name, code });
    if (!emailResult.ok) {
      req.log.warn({ reason: emailResult.reason }, "verification email failed");
    }

    const token = signToken({ userId: id, email, role: "aluno" });

    return res.status(201).json({
      ok:            true,
      token,
      user:          { id, name, email, role: "aluno" },
      emailVerified: false,
      emailSent:     emailResult.ok,
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "internal" });
  }
});

/** POST /api/auth/login */
router.post("/login", validate(LoginBody), async (req: any, res: any) => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    const row = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .get();

    if (!row) {
      return res.status(401).json({ error: "invalid_credentials", message: "E-mail ou password incorrectos." });
    }

    const valid = await bcrypt.compare(password, row.passwordHash ?? "");
    if (!valid) {
      return res.status(401).json({ error: "invalid_credentials", message: "E-mail ou password incorrectos." });
    }

    const token = signToken({ userId: row.id, email: row.email ?? "", role: (row.role as any) ?? "aluno" });

    return res.json({
      ok:            true,
      token,
      user:          { id: row.id, name: row.name ?? "", email: row.email ?? "", role: row.role ?? "aluno" },
      emailVerified: !!row.emailVerified,
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "internal" });
  }
});

/**
 * POST /api/auth/forgot-password
 * Body: { email }
 * Always returns 200 — never leaks whether email exists (security)
 */
router.post("/forgot-password", async (req: any, res: any) => {
  try {
    const { email } = req.body ?? {};
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "invalid_email" });
    }

    const user = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim())).get();

    if (!user) return res.json({ ok: true }); /* never reveal existence */

    const token     = randomBytes(32).toString("hex");
    const now       = Date.now();
    const expiresAt = now + RESET_TTL_MS;

    await db.insert(passwordResetTokensTable).values({ token, userId: user.id, expiresAt, createdAt: now });

    sendPasswordResetEmail({ to: user.email ?? email, name: user.name ?? "utilizador", token })
      .then((r) => { if (!r.ok) req.log.warn({ reason: r.reason }, "forgot-password email failed"); })
      .catch(() => {});

    return res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    return res.json({ ok: true }); /* always 200 for security */
  }
});

/**
 * POST /api/auth/reset-password
 * Body: { token, newPassword }
 */
router.post("/reset-password", async (req: any, res: any) => {
  try {
    const { token, newPassword } = req.body ?? {};
    if (!token || !newPassword || typeof token !== "string" || typeof newPassword !== "string") {
      return res.status(400).json({ error: "invalid_input", message: "Token e nova password são obrigatórios." });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: "password_too_short", message: "A password deve ter pelo menos 8 caracteres." });
    }

    const row = await db.select().from(passwordResetTokensTable).where(eq(passwordResetTokensTable.token, token)).get();

    if (!row)                       return res.status(400).json({ error: "invalid_token",  message: "Link inválido ou já utilizado." });
    if (row.usedAt)                 return res.status(400).json({ error: "token_used",     message: "Este link já foi utilizado." });
    if (row.expiresAt < Date.now()) return res.status(400).json({ error: "token_expired",  message: "Este link expirou. Solicita um novo." });

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    const now          = Date.now();

    await db.update(usersTable).set({ passwordHash, updatedAt: now }).where(eq(usersTable.id, row.userId));
    await db.update(passwordResetTokensTable).set({ usedAt: now }).where(eq(passwordResetTokensTable.token, token));

    return res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "internal" });
  }
});

/* =========================================================================
 * Email Verification
 * ========================================================================= */

/**
 * POST /api/auth/verify-email
 * Body: { code: string }
 * Requires auth token (JWT)
 */
router.post("/verify-email", requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    const { code } = req.body ?? {};
    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "invalid_code", message: "Código inválido." });
    }

    // Find latest unused code for this user
    const row = await db
      .select()
      .from(emailVerificationsTable)
      .where(eq(emailVerificationsTable.userId, userId))
      .all()
      .then((rows) => rows.filter((r) => !r.used).sort((a, b) => b.createdAt - a.createdAt)[0]);

    if (!row)              return res.status(400).json({ error: "no_pending_verification", message: "Nenhum código de verificação pendente." });
    if (row.code !== code) return res.status(400).json({ error: "invalid_code", message: "Código incorrecto." });
    if (row.expiresAt < Date.now()) return res.status(400).json({ error: "code_expired", message: "Código expirado. Solicita um novo." });

    const now = Date.now();
    await db.update(emailVerificationsTable).set({ used: 1 }).where(eq(emailVerificationsTable.id, row.id));
    await db.update(usersTable).set({ emailVerified: 1, updatedAt: now }).where(eq(usersTable.id, userId));

    return res.json({ ok: true, message: "Email verificado com sucesso." });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "internal" });
  }
});

/**
 * POST /api/auth/resend-verification
 * Resend a new 6-digit code to the authenticated user's email
 */
router.post("/resend-verification", requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    const user = await db.select().from(usersTable).where(eq(usersTable.id, userId)).get();
    if (!user) return res.status(404).json({ error: "user_not_found" });
    if (user.emailVerified) return res.json({ ok: true, message: "Email já verificado." });

    const now    = Date.now();
    const code   = String(Math.floor(100000 + Math.random() * 900000));
    const evId   = `ev_${now}_${randomBytes(4).toString("hex")}`;

    await db.insert(emailVerificationsTable).values({
      id: evId, userId, email: user.email ?? "", code,
      expiresAt: now + VERIFY_TTL_MS, used: 0, createdAt: now,
    });

    const result = await sendEmailVerificationCode({ to: user.email ?? "", name: user.name ?? "utilizador", code });
    if (!result.ok) {
      req.log.warn({ reason: result.reason }, "resend-verification email failed");
      return res.status(500).json({ error: "email_failed", message: "Não foi possível enviar o email. Tenta novamente." });
    }

    return res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "internal" });
  }
});

/* =========================================================================
 * Google OAuth 2.0
 * ========================================================================= */

/** GET /api/auth/google/status — public, returns whether Google auth is available */
router.get("/google/status", async (req: any, res: any) => {
  try {
    const cfg = await getGoogleConfig();
    const configured = !!(cfg?.clientId && cfg?.clientSecret);
    const enabled    = configured && cfg?.enabled === true;
    res.json({ enabled, configured, callbackUrl: buildCallbackUrl(req) });
  } catch {
    res.json({ enabled: false, configured: false });
  }
});

/** GET /api/auth/google — redirect user to Google consent page */
router.get("/google", async (req: any, res: any) => {
  try {
    const cfg = await getGoogleConfig();
    const fe  = frontendOrigin(req);

    if (!cfg?.enabled || !cfg?.clientId || !cfg?.clientSecret) {
      return res.redirect(`${fe}/entrar?error=google_not_configured`);
    }

    const state = randomBytes(16).toString("hex");
    oauthStates.set(state, Date.now());

    const callbackUrl = buildCallbackUrl(req);
    const params = new URLSearchParams({
      client_id:     cfg.clientId,
      redirect_uri:  callbackUrl,
      response_type: "code",
      scope:         "openid email profile",
      access_type:   "offline",
      prompt:        "select_account",
      state,
    });

    return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  } catch (err) {
    req.log.error(err);
    return res.redirect(`${frontendOrigin(req)}/entrar?error=google_error`);
  }
});

/** GET /api/auth/google/callback — Google redirects here with ?code=&state= */
router.get("/google/callback", async (req: any, res: any) => {
  const fe = frontendOrigin(req);

  try {
    const { code, state, error } = req.query as Record<string, string | undefined>;

    /* User denied access */
    if (error) return res.redirect(`${fe}/auth/google/resultado?error=google_denied`);

    /* Validate state (CSRF) */
    const stateTs = state ? oauthStates.get(state) : undefined;
    if (!stateTs || Date.now() - stateTs > 10 * 60 * 1000) {
      return res.redirect(`${fe}/auth/google/resultado?error=google_denied`);
    }
    oauthStates.delete(state!);

    /* Get config */
    const cfg = await getGoogleConfig();
    if (!cfg?.clientId || !cfg?.clientSecret) {
      return res.redirect(`${fe}/auth/google/resultado?error=google_not_configured`);
    }

    /* Exchange code for tokens */
    const callbackUrl = buildCallbackUrl(req);
    const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code:          code ?? "",
        client_id:     cfg.clientId,
        client_secret: cfg.clientSecret,
        redirect_uri:  callbackUrl,
        grant_type:    "authorization_code",
      }),
    });

    if (!tokenResp.ok) {
      req.log.error({ status: tokenResp.status }, "Google token exchange failed");
      return res.redirect(`${fe}/auth/google/resultado?error=google_error`);
    }

    const tokenData = await tokenResp.json() as any;
    const accessToken = tokenData.access_token;

    /* Get user info */
    const userInfoResp = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userInfoResp.ok) {
      return res.redirect(`${fe}/auth/google/resultado?error=google_error`);
    }

    const gUser = await userInfoResp.json() as {
      id: string; email?: string; name?: string; given_name?: string;
    };

    const googleId = gUser.id;
    const googleEmail = gUser.email?.toLowerCase().trim();
    const googleName  = gUser.name ?? gUser.given_name ?? "";

    /* No email provided by Google */
    if (!googleEmail) {
      return res.redirect(`${fe}/auth/google/resultado?error=google_no_email`);
    }

    const now = Date.now();

    /* Check if user already linked to this Google account */
    const byGoogleId = await db.select().from(usersTable).where(eq(usersTable.googleId, googleId)).get();
    if (byGoogleId) {
      await db.update(usersTable).set({ updatedAt: now }).where(eq(usersTable.id, byGoogleId.id));
      const jwt = signToken({ userId: byGoogleId.id, email: byGoogleId.email ?? googleEmail, role: (byGoogleId.role as any) ?? "aluno" });
      const params = new URLSearchParams({
        token: jwt, userId: byGoogleId.id,
        name:  byGoogleId.name ?? googleName,
        email: byGoogleId.email ?? googleEmail,
        isNew: "false",
      });
      return res.redirect(`${fe}/auth/google/resultado?${params}`);
    }

    /* Check if email already exists (password account) */
    const byEmail = await db.select().from(usersTable).where(eq(usersTable.email, googleEmail)).get();
    if (byEmail) {
      /* Link Google to existing account */
      await db.update(usersTable).set({ googleId, updatedAt: now }).where(eq(usersTable.id, byEmail.id));
      const jwt = signToken({ userId: byEmail.id, email: byEmail.email ?? googleEmail, role: (byEmail.role as any) ?? "aluno" });
      const params = new URLSearchParams({
        token: jwt, userId: byEmail.id,
        name:  byEmail.name ?? googleName,
        email: byEmail.email ?? googleEmail,
        isNew: "false",
      });
      return res.redirect(`${fe}/auth/google/resultado?${params}`);
    }

    /* New user — create account */
    const newId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    await db.insert(usersTable).values({
      id: newId, name: googleName, email: googleEmail,
      googleId, createdAt: now, updatedAt: now,
    });

    const jwt = signToken({ userId: newId, email: googleEmail, role: "aluno" });
    const params = new URLSearchParams({
      token: jwt, userId: newId,
      name:  googleName,
      email: googleEmail,
      isNew: "true",
    });
    return res.redirect(`${fe}/auth/google/resultado?${params}`);

  } catch (err) {
    req.log.error(err);
    return res.redirect(`${fe}/auth/google/resultado?error=google_error`);
  }
});

/**
 * POST /api/auth/logout
 * Revokes the JWT so it is rejected on all future requests, even before expiry.
 * Always returns 200 — the client should clear its local session regardless.
 */
router.post("/logout", async (req: any, res: any) => {
  const header = req.headers.authorization as string | undefined;
  if (header?.startsWith("Bearer ")) {
    const token = header.slice(7);
    try {
      const secret = process.env["JWT_SECRET"]!;
      const decoded = jwt.verify(token, secret) as JwtPayload;
      if (decoded.jti) {
        const expiresAt = (decoded.exp ?? 0) * 1000; // JWT exp is in seconds
        await revokeToken(decoded.jti, expiresAt);
      }
    } catch {
      // Token already invalid/expired — nothing to revoke
    }
  }
  return res.json({ ok: true });
});

/* ── Master login ─────────────────────────────────────────────────────────
 * POST /auth/master/login
 * Body: { email, password }
 * Returns a JWT with role="master". The master account lives in a separate
 * table and is never exposed through normal user endpoints.
 * ──────────────────────────────────────────────────────────────────────── */
router.post("/master/login", async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return res.status(400).json({ error: "missing_fields", message: "Email e password são obrigatórios." });
    }

    const master = await db
      .select()
      .from(masterAccountTable)
      .where(eq(masterAccountTable.email, String(email).toLowerCase().trim()))
      .get();

    if (!master) {
      return res.status(401).json({ error: "invalid_credentials", message: "Credenciais inválidas." });
    }

    const valid = await bcrypt.compare(String(password), master.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "invalid_credentials", message: "Credenciais inválidas." });
    }

    const token = signToken({ userId: master.id, email: master.email, role: "master" });

    return res.json({
      ok:    true,
      token,
      user:  { id: master.id, email: master.email, name: "Master", role: "master" },
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "internal" });
  }
});

export default router;
