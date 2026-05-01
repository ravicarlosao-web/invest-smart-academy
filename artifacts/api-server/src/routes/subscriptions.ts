import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { db, subscriptionsTable, notificationsTable, eq, desc, and } from "@workspace/db";
import { SubscriptionRequestBody, SubscriptionReferenceBody } from "@workspace/api-zod";
import { validate } from "../middlewares/validate";

const router = Router();

/* ── Notification helper ─────────────────────────────────────────────────── */
async function createNotif(userId: string, type: string, title: string, message: string, link?: string) {
  const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  try {
    await db.insert(notificationsTable).values({
      id, userId, type, title, message,
      link: link ?? null,
      isRead:    0,
      createdAt: Date.now(),
    });
  } catch { /* best-effort — never block the main response */ }
}

async function hasRecentNotif(userId: string, titleIncludes: string, withinMs: number): Promise<boolean> {
  const cutoff = Date.now() - withinMs;
  const rows = await db.select().from(notificationsTable)
    .where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.type, "system")))
    .all();
  return rows.some((n) => n.title.includes(titleIncludes) && n.createdAt >= cutoff);
}

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
      .where(eq(subscriptionsTable.userId, String(req.params.userId)))
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

      /* Notificação de expiração (deduplicada por 24h) */
      const alreadySent = await hasRecentNotif(sub.userId, "expirou", 24 * 60 * 60 * 1000);
      if (!alreadySent) {
        await createNotif(
          sub.userId, "system",
          "Subscrição expirou",
          "A tua subscrição expirou. Renova para manter o acesso ao conteúdo Intermédio e Avançado.",
          "/perfil",
        );
      }
    }

    /* Aviso antecipado: 7 dias antes de expirar (deduplicado por 6 dias) */
    if (sub.status === "active" && sub.expiresAt) {
      const daysLeft = Math.ceil((sub.expiresAt - now) / (24 * 60 * 60 * 1000));
      if (daysLeft <= 7 && daysLeft > 0) {
        const alreadySent = await hasRecentNotif(sub.userId, "expira em", 6 * 24 * 60 * 60 * 1000);
        if (!alreadySent) {
          await createNotif(
            sub.userId, "system",
            `Subscrição expira em ${daysLeft} dia${daysLeft === 1 ? "" : "s"}`,
            `A tua subscrição expira em ${daysLeft} dia${daysLeft === 1 ? "" : "s"}. Renova já para não perder o acesso.`,
            "/perfil",
          );
        }
      }
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
      .where(eq(subscriptionsTable.userId, String(req.params.userId)))
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
          eq(subscriptionsTable.id, String(req.params.id)),
          eq(subscriptionsTable.userId, String(req.params.userId)),
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
router.post("/:userId/request", validate(SubscriptionRequestBody), async (req, res) => {
  try {
    const { paymentReference, receiptData, receiptMimeType, receiptFilename } = req.body;
    const now = Date.now();

    const existing = await db
      .select()
      .from(subscriptionsTable)
      .where(
        and(
          eq(subscriptionsTable.userId, String(req.params.userId)),
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
          eq(subscriptionsTable.userId, String(req.params.userId)),
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
      userId: String(req.params.userId),
      status:           "pending",
      amount:           5000,
      paymentReference: paymentReference ?? null,
      receiptData:      receiptData ?? null,
      receiptMimeType:  receiptMimeType ?? null,
      receiptFilename:  receiptFilename ?? null,
      createdAt:        now,
      updatedAt:        now,
    });

    /* Notificação de confirmação do pedido */
    await createNotif(
      String(req.params.userId), "system",
      "Pedido de subscrição enviado",
      "O teu pedido foi recebido e está a aguardar aprovação pelo admin. Receberás uma notificação assim que for processado.",
      "/perfil",
    );

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
router.patch("/:userId/reference", validate(SubscriptionReferenceBody), async (req, res) => {
  try {
    const { paymentReference, receiptData, receiptMimeType, receiptFilename } = req.body;
    const now = Date.now();

    const sub = await db
      .select()
      .from(subscriptionsTable)
      .where(
        and(
          eq(subscriptionsTable.userId, String(req.params.userId)),
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
