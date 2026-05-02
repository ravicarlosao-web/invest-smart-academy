/**
 * receiptPurge.ts
 *
 * Background job that deletes receipt data (base64 PDF/image stored in the DB)
 * from subscriptions that were approved or rejected, after 2 business days.
 *
 * Only the receipt fields are nulled — the subscription record itself is kept.
 */

import { db, subscriptionsTable, eq, and, isNotNull, lt } from "@workspace/db";
import { logger } from "./logger.js";

const INTERVAL_MS = 60 * 60 * 1000; // run every hour
const JOB_NAME    = "receipt-purge-job";

/**
 * Returns a Unix-ms timestamp that is `days` business days after `fromMs`.
 * Business days = Mon–Fri (weekends are skipped).
 */
export function addBusinessDays(fromMs: number, days: number): number {
  const d = new Date(fromMs);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay(); // 0 = Sunday, 6 = Saturday
    if (dow !== 0 && dow !== 6) added++;
  }
  return d.getTime();
}

async function purgeExpiredReceipts(): Promise<void> {
  const now = Date.now();

  try {
    const stale = await db
      .select({ id: subscriptionsTable.id })
      .from(subscriptionsTable)
      .where(
        and(
          isNotNull(subscriptionsTable.receiptPurgeAt),
          lt(subscriptionsTable.receiptPurgeAt, now),
          isNotNull(subscriptionsTable.receiptData),
        ),
      )
      .all();

    if (stale.length === 0) return;

    for (const { id } of stale) {
      await db
        .update(subscriptionsTable)
        .set({
          receiptData:     null,
          receiptMimeType: null,
          receiptFilename: null,
          updatedAt:       now,
        })
        .where(eq(subscriptionsTable.id, id));
    }

    logger.info(
      { count: stale.length },
      `[${JOB_NAME}] Purged receipt data from ${stale.length} subscription(s)`,
    );
  } catch (err) {
    logger.error({ err }, `[${JOB_NAME}] Error during receipt purge sweep`);
  }
}

/**
 * Starts the recurring receipt-purge job.
 * Call once after the database has been initialised.
 */
export function startReceiptPurgeJob(): ReturnType<typeof setInterval> {
  purgeExpiredReceipts();

  const handle = setInterval(purgeExpiredReceipts, INTERVAL_MS);

  if (handle.unref) handle.unref();

  logger.info(`[${JOB_NAME}] Started — interval: ${INTERVAL_MS / 1000}s`);
  return handle;
}
