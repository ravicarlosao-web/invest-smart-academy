import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { db, duelosTable, eq, desc, and } from "@workspace/db";
import { DueloCreateBody, DueloPatchBody } from "@workspace/api-zod";
import { validate } from "../middlewares/validate";

const router = Router();

router.param("userId", (req: Request, res: Response, next: NextFunction, userId: string) => {
  if (req.userId !== userId) {
    return res.status(403).json({ error: "forbidden", message: "Acesso não autorizado." });
  }
  next();
});

/** GET /api/duelos/:userId */
router.get("/:userId", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(duelosTable)
      .where(eq(duelosTable.userId, String(req.params.userId)))
      .orderBy(desc(duelosTable.createdAt))
      .all();

    res.json(rows.map((r) => ({ ...r, accepted: r.accepted === 1 })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/** GET /api/duelos/code/:code — resolve a duelo by code (for joining) */
router.get("/code/:code", async (req, res) => {
  try {
    const row = await db
      .select()
      .from(duelosTable)
      .where(eq(duelosTable.code, String(req.params.code)))
      .get();

    if (!row) return res.status(404).json({ error: "not_found" });
    res.json({ ...row, accepted: row.accepted === 1 });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/** POST /api/duelos/:userId — create a new duelo */
router.post("/:userId", validate(DueloCreateBody), async (req, res) => {
  try {
    const b    = req.body;
    const id   = `duelo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const code = b.code
      ?? Buffer.from(JSON.stringify({ id, userId: String(req.params.userId) }))
           .toString("base64url")
           .slice(0, 32);

    await db.insert(duelosTable).values({
      id,
      userId: String(req.params.userId),
      title:          b.title,
      targetEquity:   b.targetEquity,
      startBalance:   b.startBalance,
      maxDrawdownPct: b.maxDrawdownPct,
      maxTrades:      b.maxTrades,
      expiresAt:      b.expiresAt,
      createdAt:      Date.now(),
      startEquity:    b.startEquity ?? 0,
      accepted:       b.accepted ? 1 : 0,
      code,
    });

    res.json({ ok: true, id, code });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/** PATCH /api/duelos/:userId/:id — update (e.g. accept, update startEquity) */
router.patch("/:userId/:id", validate(DueloPatchBody), async (req, res) => {
  try {
    const b = req.body;

    const update: Record<string, unknown> = {};
    if (b.accepted   != null) update.accepted    = b.accepted ? 1 : 0;
    if (b.startEquity != null) update.startEquity = b.startEquity;

    if (Object.keys(update).length === 0) {
      return res.status(422).json({ error: "validation_error", message: "Nenhum campo para actualizar." });
    }

    await db
      .update(duelosTable)
      .set(update)
      .where(and(eq(duelosTable.id, String(req.params.id)), eq(duelosTable.userId, String(req.params.userId))));

    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/** DELETE /api/duelos/:userId/:id — only the owner can delete their own duelo */
router.delete("/:userId/:id", async (req, res) => {
  try {
    const result = await db
      .delete(duelosTable)
      .where(and(eq(duelosTable.id, String(req.params.id)), eq(duelosTable.userId, String(req.params.userId))));

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: "not_found", message: "Duelo não encontrado." });
    }
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

export default router;
