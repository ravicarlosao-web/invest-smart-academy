import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db, duelosTable } from "@workspace/db";

const router = Router();

/** GET /api/duelos/:userId */
router.get("/:userId", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(duelosTable)
      .where(eq(duelosTable.userId, req.params.userId))
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
      .where(eq(duelosTable.code, req.params.code))
      .get();

    if (!row) return res.status(404).json({ error: "not_found" });
    res.json({ ...row, accepted: row.accepted === 1 });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/** POST /api/duelos/:userId — create a new duelo */
router.post("/:userId", async (req, res) => {
  try {
    const b      = req.body;
    const id     = `duelo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const code   = b.code ?? btoa(JSON.stringify({ ...b, id })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

    await db.insert(duelosTable).values({
      id,
      userId:         req.params.userId,
      title:          String(b.title),
      targetEquity:   Number(b.targetEquity),
      startBalance:   Number(b.startBalance),
      maxDrawdownPct: Number(b.maxDrawdownPct),
      maxTrades:      Number(b.maxTrades),
      expiresAt:      Number(b.expiresAt),
      createdAt:      Date.now(),
      startEquity:    Number(b.startEquity ?? 0),
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
router.patch("/:userId/:id", async (req, res) => {
  try {
    const b = req.body;
    await db
      .update(duelosTable)
      .set({
        accepted:    b.accepted != null ? (b.accepted ? 1 : 0) : undefined,
        startEquity: b.startEquity != null ? Number(b.startEquity) : undefined,
      })
      .where(eq(duelosTable.id, req.params.id));

    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/** DELETE /api/duelos/:userId/:id */
router.delete("/:userId/:id", async (req, res) => {
  try {
    await db.delete(duelosTable).where(eq(duelosTable.id, req.params.id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

export default router;
