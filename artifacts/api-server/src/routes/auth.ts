import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, eq } from "@workspace/db";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import { signToken } from "../middlewares/auth";
import { validate } from "../middlewares/validate";

const router = Router();

const BCRYPT_ROUNDS = 12;

/** POST /api/auth/register */
router.post("/register", validate(RegisterBody), async (req, res) => {
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
router.post("/login", validate(LoginBody), async (req, res) => {
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

export default router;
