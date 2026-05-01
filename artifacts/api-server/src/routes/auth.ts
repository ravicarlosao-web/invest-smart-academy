import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, eq } from "@workspace/db";
import { signToken } from "../middlewares/auth";

const router = Router();

const BCRYPT_ROUNDS = 12;

/** POST /api/auth/register
 *  Body: { id, name, email, password }
 *  Server hashes the password with bcrypt (BCRYPT_ROUNDS rounds).
 */
router.post("/register", async (req, res) => {
  try {
    const { id, name, email, password } = req.body as {
      id: string; name: string; email: string; password: string;
    };

    if (!id || !name || !email || !password) {
      return res.status(400).json({ error: "missing_fields", message: "Todos os campos são obrigatórios." });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "password_too_short", message: "A password deve ter pelo menos 6 caracteres." });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "invalid_email", message: "E-mail inválido." });
    }

    const existing = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase()))
      .get();

    if (existing) {
      return res.status(409).json({ error: "email_taken", message: "Este e-mail já está em uso." });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const now = Date.now();

    await db.insert(usersTable).values({
      id,
      name:         name.trim(),
      email:        email.toLowerCase(),
      passwordHash,
      createdAt:    now,
      updatedAt:    now,
    });

    const token = signToken({ userId: id, email: email.toLowerCase() });

    return res.status(201).json({
      ok:   true,
      token,
      user: { id, name: name.trim(), email: email.toLowerCase() },
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "internal" });
  }
});

/** POST /api/auth/login
 *  Body: { email, password }
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    if (!email || !password) {
      return res.status(400).json({ error: "missing_fields", message: "E-mail e password são obrigatórios." });
    }

    const row = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase()))
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

export default router;
