// @ts-nocheck
import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import {
  db, duelosTable, progressTable, usersTable,
  eq, desc, and,
} from "@workspace/db";
import { DueloCreateBody, DueloPatchBody } from "@workspace/api-zod";
import { validate } from "../middlewares/validate.js";

const router = Router();

router.param("userId", (req: Request, res: Response, next: NextFunction, userId: string) => {
  if (req.userId !== userId) {
    return res.status(403).json({ error: "forbidden", message: "Acesso não autorizado." });
  }
  next();
});

/* ═══════════════════════════════════════════════════════════════════════════
 * SPECIAL ROUTES — defined BEFORE /:userId to avoid being shadowed
 * ══════════════════════════════════════════════════════════════════════════ */

/**
 * POST /api/duelos/join
 * Join a duelo as the opponent — sets opponent_user_id on the creator's row.
 * Body: { code: string }
 */
router.post("/join", async (req: any, res: any) => {
  try {
    const { code } = req.body ?? {};
    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "invalid_code", message: "Código inválido." });
    }

    const duelo = await db.select().from(duelosTable).where(eq(duelosTable.code, code)).get();
    if (!duelo)                           return res.status(404).json({ error: "not_found",  message: "Duelo não encontrado." });
    if (duelo.expiresAt < Date.now())     return res.status(400).json({ error: "expired",    message: "Este duelo já expirou." });
    if (duelo.userId === req.userId)      return res.status(400).json({ error: "own_duelo",  message: "Não podes entrar no teu próprio duelo." });
    if (duelo.opponentUserId && duelo.opponentUserId !== req.userId) {
      return res.status(409).json({ error: "duelo_full", message: "Este duelo já tem um oponente." });
    }

    if (!duelo.opponentUserId) {
      await db
        .update(duelosTable)
        .set({ opponentUserId: req.userId, accepted: 1 })
        .where(eq(duelosTable.code, code));
    }

    return res.json({
      ok: true,
      duelo: { ...duelo, accepted: true, opponentUserId: req.userId },
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "internal" });
  }
});

/**
 * GET /api/duelos/joined
 * Returns all duelos where the authenticated user is the opponent.
 */
router.get("/joined", async (req: any, res: any) => {
  try {
    const rows = await db
      .select()
      .from(duelosTable)
      .where(eq(duelosTable.opponentUserId, req.userId))
      .orderBy(desc(duelosTable.createdAt))
      .all();
    res.json(rows.map((r: any) => ({ ...r, accepted: r.accepted === 1 })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/**
 * GET /api/duelos/live/:code
 * Returns both participants' server-side equity (sim_cash_balance from progress table).
 * Used for polling — no auth check on the userId, the code acts as a shared secret.
 */
router.get("/live/:code", async (req: any, res: any) => {
  try {
    const code = String(req.params.code);
    const duelo = await db.select().from(duelosTable).where(eq(duelosTable.code, code)).get();
    if (!duelo) return res.status(404).json({ error: "not_found" });

    const [creatorRow, opponentRow] = await Promise.all([
      db
        .select({ name: usersTable.name, equity: progressTable.simCashBalance })
        .from(usersTable)
        .leftJoin(progressTable, eq(progressTable.userId, usersTable.id))
        .where(eq(usersTable.id, duelo.userId))
        .get(),
      duelo.opponentUserId
        ? db
            .select({ name: usersTable.name, equity: progressTable.simCashBalance })
            .from(usersTable)
            .leftJoin(progressTable, eq(progressTable.userId, usersTable.id))
            .where(eq(usersTable.id, duelo.opponentUserId))
            .get()
        : Promise.resolve(null),
    ]);

    return res.json({
      accepted: duelo.accepted === 1,
      creator: creatorRow
        ? { name: creatorRow.name ?? "Utilizador", equity: creatorRow.equity ?? duelo.startBalance }
        : null,
      opponent: opponentRow
        ? { name: opponentRow.name ?? "Oponente", equity: opponentRow.equity ?? duelo.startBalance }
        : null,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/** GET /api/duelos/code/:code — resolve a duelo by join code */
router.get("/code/:code", async (req: any, res: any) => {
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

/* ═══════════════════════════════════════════════════════════════════════════
 * PARAMETERISED /:userId ROUTES
 * ══════════════════════════════════════════════════════════════════════════ */

/** GET /api/duelos/:userId */
router.get("/:userId", async (req: any, res: any) => {
  try {
    const rows = await db
      .select()
      .from(duelosTable)
      .where(eq(duelosTable.userId, String(req.params.userId)))
      .orderBy(desc(duelosTable.createdAt))
      .all();

    res.json(rows.map((r: any) => ({ ...r, accepted: r.accepted === 1 })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/** POST /api/duelos/:userId — create a new duelo */
router.post("/:userId", validate(DueloCreateBody), async (req: any, res: any) => {
  try {
    const b    = req.body;
    const id   = `duelo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const code = b.code
      ?? Buffer.from(JSON.stringify({ id, userId: String(req.params.userId) }))
           .toString("base64url")
           .slice(0, 32);

    await db.insert(duelosTable).values({
      id,
      userId:         String(req.params.userId),
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

/** PATCH /api/duelos/:userId/:id — update accepted flag or startEquity */
router.patch("/:userId/:id", validate(DueloPatchBody), async (req: any, res: any) => {
  try {
    const b = req.body;

    const update: Record<string, unknown> = {};
    if (b.accepted    != null) update.accepted    = b.accepted ? 1 : 0;
    if (b.startEquity != null) update.startEquity = b.startEquity;

    if (Object.keys(update).length === 0) {
      return res.status(422).json({ error: "validation_error", message: "Nenhum campo para actualizar." });
    }

    await db
      .update(duelosTable)
      .set(update)
      .where(and(
        eq(duelosTable.id,     String(req.params.id)),
        eq(duelosTable.userId, String(req.params.userId)),
      ));

    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/** DELETE /api/duelos/:userId/:id — only the owner can delete */
router.delete("/:userId/:id", async (req: any, res: any) => {
  try {
    const result = await db
      .delete(duelosTable)
      .where(and(
        eq(duelosTable.id,     String(req.params.id)),
        eq(duelosTable.userId, String(req.params.userId)),
      ));

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
