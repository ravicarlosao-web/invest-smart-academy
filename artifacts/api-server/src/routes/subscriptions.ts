import { Router } from "express";
import { db, subscriptionsTable, usersTable, eq, desc, and } from "@workspace/db";

const router = Router();

/** Gera ID único para subscrição */
function genId(): string {
  return `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * GET /api/subscription/:userId
 * Devolve a subscrição mais recente do utilizador (ou null se não existir).
 * Verifica automaticamente se expirou e atualiza o status.
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

    // Expiração automática
    if (sub.status === "active" && sub.expiresAt && sub.expiresAt < now) {
      await db
        .update(subscriptionsTable)
        .set({ status: "expired", updatedAt: now })
        .where(eq(subscriptionsTable.id, sub.id));
      sub.status = "expired";
    }

    res.json({ subscription: sub });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/**
 * POST /api/subscription/:userId/request
 * Cria um pedido de subscrição (status: pending).
 * Body: { paymentReference?: string }
 */
router.post("/:userId/request", async (req, res) => {
  try {
    const { paymentReference } = req.body ?? {};
    const now = Date.now();

    // Não permite pedido duplicado se já tiver um pending ou active
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
      return res.status(409).json({
        error: "already_pending",
        message: "Já tens um pedido de subscrição pendente.",
      });
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
      return res.status(409).json({
        error: "already_active",
        message: "A tua subscrição já está ativa.",
      });
    }

    const id = genId();
    await db.insert(subscriptionsTable).values({
      id,
      userId:           req.params.userId,
      status:           "pending",
      amount:           5000,
      paymentReference: paymentReference ?? null,
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
 * Atualiza a referência de pagamento de um pedido pendente.
 * Body: { paymentReference: string }
 */
router.patch("/:userId/reference", async (req, res) => {
  try {
    const { paymentReference } = req.body ?? {};
    if (!paymentReference) {
      return res.status(400).json({ error: "paymentReference required" });
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

    await db
      .update(subscriptionsTable)
      .set({ paymentReference, updatedAt: now })
      .where(eq(subscriptionsTable.id, sub.id));

    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

export default router;
