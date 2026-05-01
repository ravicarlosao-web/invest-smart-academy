import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { db, subscriptionsTable, usersTable, eq, desc, and } from "@workspace/db";

const router = Router();

router.param("userId", (req: Request, res: Response, next: NextFunction, userId: string) => {
  if (req.userId !== userId) {
    return res.status(403).json({ error: "forbidden", message: "Acesso não autorizado." });
  }
  next();
});

function genId(): string {
  return `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * GET /api/subscription/:userId
 * Devolve a subscrição mais recente (sem receiptData para resposta leve).
 */
router.get("/:userId", async (req, res) => {
  try {
    const now = Date.now();
    const sub = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.userId, req.params.userId))
      .orderBy(desc(subscriptionsTable.createdAt))
      .limit(1)
      .get();

    if (!sub) return res.json({ subscription: null });

    if (sub.status === "active" && sub.expiresAt && sub.expiresAt < now) {
      await db
        .update(subscriptionsTable)
        .set({ status: "expired", updatedAt: now })
        .where(eq(subscriptionsTable.id, sub.id));
      sub.status = "expired";
    }

    const { receiptData: _rd, ...rest } = sub;
    res.json({ subscription: { ...rest, hasReceipt: !!sub.receiptData } });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/**
 * GET /api/subscription/:userId/history
 * Devolve todo o histórico de subscrições do aluno (sem receiptData).
 */
router.get("/:userId/history", async (req, res) => {
  try {
    const now = Date.now();
    const subs = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.userId, req.params.userId))
      .orderBy(desc(subscriptionsTable.createdAt))
      .all();

    const result = subs.map((sub) => {
      if (sub.status === "active" && sub.expiresAt && sub.expiresAt < now) {
        sub.status = "expired";
      }
      const { receiptData: _rd, ...rest } = sub;
      return { ...rest, hasReceipt: !!sub.receiptData };
    });

    res.json({ subscriptions: result });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/**
 * GET /api/subscription/:userId/receipt/:id
 * Serve o ficheiro comprovativo como base64 para visualização/download.
 */
router.get("/:userId/receipt/:id", async (req, res) => {
  try {
    const sub = await db
      .select()
      .from(subscriptionsTable)
      .where(
        and(
          eq(subscriptionsTable.id, req.params.id),
          eq(subscriptionsTable.userId, req.params.userId),
        ),
      )
      .get();

    if (!sub || !sub.receiptData) {
      return res.status(404).json({ error: "receipt_not_found" });
    }

    res.json({
      receiptData:     sub.receiptData,
      receiptMimeType: sub.receiptMimeType,
      receiptFilename: sub.receiptFilename,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/**
 * POST /api/subscription/:userId/request
 * Cria pedido de subscrição. Body: { paymentReference?, receiptData?, receiptMimeType?, receiptFilename? }
 */
router.post("/:userId/request", async (req, res) => {
  try {
    const { paymentReference, receiptData, receiptMimeType, receiptFilename } = req.body ?? {};
    const now = Date.now();

    const existing = await db
      .select()
      .from(subscriptionsTable)
      .where(
        and(
          eq(subscriptionsTable.userId, req.params.userId),
          eq(subscriptionsTable.status, "pending"),
        ),
      )
      .get();

    if (existing) {
      return res.status(409).json({ error: "already_pending", message: "Já tens um pedido pendente." });
    }

    const activeExisting = await db
      .select()
      .from(subscriptionsTable)
      .where(
        and(
          eq(subscriptionsTable.userId, req.params.userId),
          eq(subscriptionsTable.status, "active"),
        ),
      )
      .get();

    if (activeExisting && activeExisting.expiresAt && activeExisting.expiresAt > now) {
      return res.status(409).json({ error: "already_active", message: "A tua subscrição já está ativa." });
    }

    const id = genId();
    await db.insert(subscriptionsTable).values({
      id,
      userId:           req.params.userId,
      status:           "pending",
      amount:           5000,
      paymentReference: paymentReference ?? null,
      receiptData:      receiptData ?? null,
      receiptMimeType:  receiptMimeType ?? null,
      receiptFilename:  receiptFilename ?? null,
      createdAt:        now,
      updatedAt:        now,
    });

    res.json({ ok: true, id });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/**
 * PATCH /api/subscription/:userId/reference
 * Atualiza referência e/ou comprovativo de um pedido pendente.
 */
router.patch("/:userId/reference", async (req, res) => {
  try {
    const { paymentReference, receiptData, receiptMimeType, receiptFilename } = req.body ?? {};
    if (!paymentReference && !receiptData) {
      return res.status(400).json({ error: "paymentReference or receiptData required" });
    }
    const now = Date.now();

    const sub = await db
      .select()
      .from(subscriptionsTable)
      .where(
        and(
          eq(subscriptionsTable.userId, req.params.userId),
          eq(subscriptionsTable.status, "pending"),
        ),
      )
      .orderBy(desc(subscriptionsTable.createdAt))
      .limit(1)
      .get();

    if (!sub) return res.status(404).json({ error: "no_pending" });

    const update: Record<string, unknown> = { updatedAt: now };
    if (paymentReference) update.paymentReference = paymentReference;
    if (receiptData) {
      update.receiptData     = receiptData;
      update.receiptMimeType = receiptMimeType ?? null;
      update.receiptFilename = receiptFilename ?? null;
    }

    await db.update(subscriptionsTable).set(update).where(eq(subscriptionsTable.id, sub.id));

    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

export default router;
