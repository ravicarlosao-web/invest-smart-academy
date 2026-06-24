// @ts-nocheck
/**
 * subscriptionExpiryWarning.ts
 *
 * Background job que corre a cada 6 horas e envia notificação in-app + email
 * aos alunos cuja subscrição expira nos próximos 3 dias.
 *
 * Garante que o aviso não é enviado mais do que uma vez por subscrição,
 * verificando se já existe uma notificação de aviso nas últimas 96 horas.
 */

import {
  db,
  subscriptionsTable,
  notificationsTable,
  plansTable,
  usersTable,
  eq,
  and,
  isNotNull,
  gt,
  lt,
} from "@workspace/db";
import { sendSubscriptionExpiryWarningEmail } from "./email.js";
import { logger } from "./logger.js";

const INTERVAL_MS    = 6 * 60 * 60 * 1000;   // a cada 6 horas
const WARNING_DAYS   = 3;                      // avisar 3 dias antes
const DEDUP_WINDOW   = 96 * 60 * 60 * 1000;   // não repetir aviso dentro de 96 h
const JOB_NAME       = "subscription-expiry-warning-job";
const NOTIF_TITLE    = "A tua subscrição expira em breve";

async function sendExpiryWarnings(): Promise<void> {
  const now       = Date.now();
  const warningMs = WARNING_DAYS * 24 * 60 * 60 * 1000;
  const cutoff    = now + warningMs; // expiresAt <= cutoff (dentro dos próximos 3 dias)

  try {
    /* 1. Encontrar subscrições activas que expiram nos próximos 3 dias */
    const subs = await db
      .select()
      .from(subscriptionsTable)
      .where(
        and(
          eq(subscriptionsTable.status, "active"),
          isNotNull(subscriptionsTable.expiresAt),
          gt(subscriptionsTable.expiresAt, now),      // ainda não expirou
          lt(subscriptionsTable.expiresAt, cutoff),   // expira dentro de 3 dias
        ),
      )
      .all();

    if (subs.length === 0) return;

    logger.info({ count: subs.length }, `[${JOB_NAME}] Found ${subs.length} subscription(s) expiring within ${WARNING_DAYS} days`);

    /* 1b. Pré-carregar mapa de planos para lookup O(1) */
    const planRows = await db
      .select({ id: plansTable.id, name: plansTable.name })
      .from(plansTable)
      .all();
    const planMap: Record<string, string> = Object.fromEntries(
      planRows.map((p: any) => [p.id, p.name]),
    );

    for (const sub of subs) {
      try {
        /* 2. Verificar se já foi enviado aviso recentemente (dedup por janela de 96h) */
        const dedupCutoff = now - DEDUP_WINDOW;
        const existing = await db
          .select({ id: notificationsTable.id, createdAt: notificationsTable.createdAt })
          .from(notificationsTable)
          .where(
            and(
              eq(notificationsTable.userId, sub.userId),
              eq(notificationsTable.type, "expiry_warning"),
            ),
          )
          .all();

        const alreadySent = existing.some((n: any) => n.createdAt >= dedupCutoff);
        if (alreadySent) continue;

        /* 3. Calcular dias restantes + nome do plano */
        const msLeft   = sub.expiresAt - now;
        const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
        const planName = sub.planId ? (planMap[sub.planId] ?? null) : null;
        const planLabel = planName ?? "subscrição Premium";

        /* 4. Criar notificação in-app */
        const notifId = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        await db.insert(notificationsTable).values({
          id:        notifId,
          userId:    sub.userId,
          type:      "expiry_warning",
          title:     NOTIF_TITLE,
          message:   `O teu ${planLabel} expira em ${daysLeft} ${daysLeft === 1 ? "dia" : "dias"}. Renova para manter o acesso aos níveis Intermediário e Avançado.`,
          link:      "/aprender",
          isRead:    0,
          createdAt: now,
        });

        /* 5. Enviar email (fire-and-forget — nunca bloqueia o job) */
        const userRow = await db
          .select({ email: usersTable.email, name: usersTable.name })
          .from(usersTable)
          .where(eq(usersTable.id, sub.userId))
          .get();

        if (userRow?.email) {
          sendSubscriptionExpiryWarningEmail({
            to:        userRow.email,
            name:      userRow.name ?? "utilizador",
            expiresAt: sub.expiresAt,
            daysLeft,
            planName,
          })
            .then((r) => {
              if (!r.ok) logger.warn({ reason: r.reason, userId: sub.userId }, `[${JOB_NAME}] Email warning failed`);
            })
            .catch(() => {});
        }

        logger.info({ userId: sub.userId, daysLeft }, `[${JOB_NAME}] Warning sent`);
      } catch (innerErr) {
        logger.error({ err: innerErr, subId: sub.id }, `[${JOB_NAME}] Error processing subscription`);
      }
    }
  } catch (err) {
    logger.error({ err }, `[${JOB_NAME}] Error during warning sweep`);
  }
}

/**
 * Inicia o job recorrente de aviso de expiração.
 * Retorna o handle do interval para poder ser cancelado em testes.
 */
export function startSubscriptionExpiryWarningJob(): ReturnType<typeof setInterval> {
  // Correr imediatamente no arranque
  sendExpiryWarnings();

  const handle = setInterval(sendExpiryWarnings, INTERVAL_MS);

  if (handle.unref) handle.unref();

  logger.info(`[${JOB_NAME}] Started — interval: ${INTERVAL_MS / 1000 / 3600}h`);
  return handle;
}
