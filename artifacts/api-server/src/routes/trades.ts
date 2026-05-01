import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { db, tradesTable, eq, desc } from "@workspace/db";
import { TradesBody } from "@workspace/api-zod";
import { validate } from "../middlewares/validate";

const router = Router();

router.param("userId", (req: Request, res: Response, next: NextFunction, userId: string) => {
  if (req.userId !== userId) {
    return res.status(403).json({ error: "forbidden", message: "Acesso não autorizado." });
  }
  next();
});

/** GET /api/trades/:userId?limit=50 */
router.get("/:userId", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 500);
    const rows = await db
      .select()
      .from(tradesTable)
      .where(eq(tradesTable.userId, String(req.params.userId)))
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
router.post("/:userId", validate(TradesBody), async (req, res) => {
  try {
    const userId = String(req.params.userId);
    const raw    = req.body;
    const items  = Array.isArray(raw) ? raw : [raw];

    const rows = items.map((t) => ({
      id:         t.id,
      userId,
      symbol:     t.symbol,
      side:       t.side as "buy" | "sell",
      size:       t.size,
      entryPrice: t.entryPrice,
      exitPrice:  t.exitPrice,
      pnl:        t.pnl,
      openedAt:   t.openedAt,
      closedAt:   t.closedAt,
      reason:     t.reason,
      leverage:   t.leverage   ?? 1,
      stopLoss:   t.stopLoss   ?? null,
      takeProfit: t.takeProfit ?? null,
      note:       t.note       ?? null,
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
    await db.delete(tradesTable).where(eq(tradesTable.userId, String(req.params.userId)));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

export default router;
