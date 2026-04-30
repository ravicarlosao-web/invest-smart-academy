import { Router } from "express";
import { db, tradesTable, eq, desc } from "@workspace/db";

const router = Router();

/** GET /api/trades/:userId?limit=50 */
router.get("/:userId", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 500);
    const rows = await db
      .select()
      .from(tradesTable)
      .where(eq(tradesTable.userId, req.params.userId))
      .orderBy(desc(tradesTable.closedAt))
      .limit(limit)
      .all();

    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/** POST /api/trades/:userId — insert one or many trades */
router.post("/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const items  = Array.isArray(req.body) ? req.body : [req.body];

    const rows = items.map((t: Record<string, unknown>) => ({
      id:         String(t.id),
      userId,
      symbol:     String(t.symbol),
      side:       String(t.side) as "buy" | "sell",
      size:       Number(t.size),
      entryPrice: Number(t.entryPrice),
      exitPrice:  Number(t.exitPrice),
      pnl:        Number(t.pnl),
      openedAt:   Number(t.openedAt),
      closedAt:   Number(t.closedAt),
      reason:     String(t.reason),
      leverage:   Number(t.leverage ?? 1),
      stopLoss:   t.stopLoss  != null ? Number(t.stopLoss)  : null,
      takeProfit: t.takeProfit != null ? Number(t.takeProfit) : null,
      note:       t.note != null ? String(t.note) : null,
    }));

    await db.insert(tradesTable).values(rows).onConflictDoNothing();
    res.json({ ok: true, inserted: rows.length });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/** DELETE /api/trades/:userId — wipe all trades for user */
router.delete("/:userId", async (req, res) => {
  try {
    await db.delete(tradesTable).where(eq(tradesTable.userId, req.params.userId));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

export default router;
