// @ts-nocheck
import { Router } from "express";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { db, usersTable, passwordResetTokensTable, eq } from "@workspace/db";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import { signToken } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { sendPasswordResetEmail } from "../lib/email.js";

const router = Router();

const BCRYPT_ROUNDS = 12;
const RESET_TTL_MS  = 60 * 60 * 1000; // 1 hora

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
      createdAt: now,
      updatedAt: now,
    });

    const token = signToken({ userId: id, email });

    return res.status(201).json({
      ok:   true,
      token,
      user: { id, name, email },
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

    const token = signToken({ userId: row.id, email: row.email ?? "" });

    return res.json({
      ok:   true,
      token,
      user: { id: row.id, name: row.name ?? "", email: row.email ?? "" },
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

export default router;
