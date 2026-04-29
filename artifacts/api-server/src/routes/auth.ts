import { Router } from "express";
import { db, usersTable, eq } from "@workspace/db";

const router = Router();

/** POST /api/auth/register
 *  Body: { id, name, email, passwordHash }
 *  The client generates the id and hashes the password locally (SHA-256).
 */
router.post("/register", async (req, res) => {
  try {
    const { id, name, email, passwordHash } = req.body as {
      id: string; name: string; email: string; passwordHash: string;
    };

    if (!id || !name || !email || !passwordHash) {
      return res.status(400).json({ error: "missing_fields" });
    }

    // Check for duplicate email (case-insensitive)
    const existing = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase()))
      .get();

    if (existing) {
      return res.status(409).json({ error: "email_taken", message: "Este e-mail já está em uso." });
    }

    const now = Date.now();
    await db.insert(usersTable).values({
      id,
      name:         name.trim(),
      email:        email.toLowerCase(),
      passwordHash,
      createdAt:    now,
      updatedAt:    now,
    });

    res.status(201).json({ ok: true, user: { id, name: name.trim(), email: email.toLowerCase() } });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/** POST /api/auth/login
 *  Body: { email, passwordHash }
 */
router.post("/login", async (req, res) => {
  try {
    const { email, passwordHash } = req.body as { email: string; passwordHash: string };

    if (!email || !passwordHash) {
      return res.status(400).json({ error: "missing_fields" });
    }

    const row = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase()))
      .get();

    if (!row || row.passwordHash !== passwordHash) {
      return res.status(401).json({ error: "invalid_credentials", message: "E-mail ou password incorrectos." });
    }

    res.json({ ok: true, user: { id: row.id, name: row.name ?? "", email: row.email ?? "" } });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

export default router;
