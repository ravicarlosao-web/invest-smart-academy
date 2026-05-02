/**
 * subscriptionExpiry.ts
 *
 * Background job that runs on a fixed interval and marks active subscriptions
 * as expired when their `expiresAt` timestamp has passed.
 *
 * This replaces the previous "lazy expiry" pattern (which only fired when the
 * admin or the user themselves hit the API) with a proactive sweep that keeps
 * the database consistent even when nobody is logged in.
 */

import { db, subscriptionsTable, eq, and, isNotNull, lt } from "@workspace/db";
import { logger } from "./logger.js";

const INTERVAL_MS = 5 * 60 * 1000; // run every 5 minutes
const JOB_NAME    = "subscription-expiry-job";

async function expireSubscriptions(): Promise<void> {
  const now = Date.now();

  try {
    // Find all active subscriptions whose expiry timestamp has passed
    const stale = await db
      .select({ id: subscriptionsTable.id })
      .from(subscriptionsTable)
      .where(
        and(
          eq(subscriptionsTable.status, "active"),
          isNotNull(subscriptionsTable.expiresAt),
          lt(subscriptionsTable.expiresAt, now),
        ),
      )
      .all();

    if (stale.length === 0) return; // nothing to do — skip noisy log

    // Expire each one
    for (const { id } of stale) {
      await db
        .update(subscriptionsTable)
        .set({ status: "expired", updatedAt: now })
        .where(eq(subscriptionsTable.id, id));
    }

    logger.info({ count: stale.length }, `[${JOB_NAME}] Marked ${stale.length} subscription(s) as expired`);
  } catch (err) {
    logger.error({ err }, `[${JOB_NAME}] Error during expiry sweep`);
  }
}

/**
 * Starts the recurring expiry job.
 * Call once after the database has been initialised.
 * Returns the interval handle so callers can cancel it in tests.
 */
export function startSubscriptionExpiryJob(): ReturnType<typeof setInterval> {
  // Run immediately on startup so stale rows are expired before first request
  expireSubscriptions();

  const handle = setInterval(expireSubscriptions, INTERVAL_MS);

  // Allow the process to exit cleanly without waiting for this interval
  if (handle.unref) handle.unref();

  logger.info(`[${JOB_NAME}] Started — interval: ${INTERVAL_MS / 1000}s`);
  return handle;
}
