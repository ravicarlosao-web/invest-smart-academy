// @ts-nocheck
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { db, revokedTokensTable, usersTable, eq } from "@workspace/db";

const JWT_SECRET = process.env["JWT_SECRET"];
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

export type UserRole = "aluno" | "professor" | "administrador" | "master";

export interface JwtPayload {
  userId: string;
  email:  string;
  role:   UserRole;
  jti:    string;
}

declare global {
  namespace Express {
    interface Request {
      userId?:    string;
      userEmail?: string;
      userRole?:  UserRole;
      jti?:       string;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "unauthorized", message: "Token de autenticação necessário." });
    return;
  }

  const token = header.slice(7);
  let decoded: JwtPayload;

  try {
    decoded = jwt.verify(token, JWT_SECRET!) as JwtPayload;
  } catch {
    res.status(401).json({ error: "token_invalid", message: "Sessão expirada. Inicia sessão novamente." });
    return;
  }

  // Blocklist check — revoked tokens are rejected immediately
  if (decoded.jti) {
    const revoked = await db
      .select({ jti: revokedTokensTable.jti })
      .from(revokedTokensTable)
      .where(eq(revokedTokensTable.jti, decoded.jti))
      .get();

    if (revoked) {
      res.status(401).json({ error: "token_revoked", message: "Sessão terminada. Inicia sessão novamente." });
      return;
    }
  }

  req.userId    = decoded.userId;
  req.userEmail = decoded.email;
  req.userRole  = (decoded.role as UserRole) ?? "aluno";
  req.jti       = decoded.jti;
  next();
}

/** Signs a new JWT (7-day expiry) and embeds a unique JTI for revocation support. */
export function signToken(payload: Omit<JwtPayload, "jti">): string {
  const jti = randomUUID();
  return jwt.sign({ ...payload, jti }, JWT_SECRET!, { expiresIn: "7d" });
}

/**
 * Middleware factory — restricts a route to one or more roles.
 * Must be placed AFTER requireAuth (which sets req.userRole).
 *
 * Usage: router.get("/secret", requireAuth, requireRole("master", "administrador"), handler)
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const role = req.userRole ?? "aluno";
    if (!roles.includes(role)) {
      res.status(403).json({ error: "forbidden", message: "Não tens permissão para aceder a este recurso." });
      return;
    }
    next();
  };
}

/**
 * Middleware that blocks access when the authenticated user hasn't verified
 * their email yet. Must run AFTER requireAuth (which sets req.userId).
 * Returns 403 { error: "email_not_verified" } if emailVerified = 0 in DB.
 */
export async function requireEmailVerified(req: Request, res: Response, next: NextFunction): Promise<void> {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  const row = await db
    .select({ emailVerified: usersTable.emailVerified })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .get();

  if (!row || !row.emailVerified) {
    res.status(403).json({
      error:   "email_not_verified",
      message: "Verifica o teu email para poderes aceder a esta funcionalidade.",
    });
    return;
  }

  next();
}

/** Adds a JTI to the blocklist so the token is rejected on every subsequent request. */
export async function revokeToken(jti: string, expiresAt: number): Promise<void> {
  try {
    await db.insert(revokedTokensTable).values({
      jti,
      expiresAt,
      revokedAt: Date.now(),
    });
  } catch {
    // Duplicate jti (double-logout) — safe to ignore
  }
}
