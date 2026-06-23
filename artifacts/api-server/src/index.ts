// @ts-nocheck
import app from "./app.js";
import { logger } from "./lib/logger.js";
import { initDb } from "@workspace/db";
import { seedContent, seedMasterAccount } from "./seed.js";
import { startSubscriptionExpiryJob } from "./lib/subscriptionExpiry.js";
import { startSubscriptionExpiryWarningJob } from "./lib/subscriptionExpiryWarning.js";
import { startReceiptPurgeJob } from "./lib/receiptPurge.js";
import { startTokenCleanupJob } from "./lib/tokenCleanup.js";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

/* Ensure all DB tables exist before accepting requests */
try {
  await initDb();
  logger.info("Database tables verified");
} catch (err) {
  logger.error({ err }, "Failed to initialise database tables");
  process.exit(1);
}

/* One-time migration: set emailVerified = 1 for pre-existing users so they
 * are not locked out after the email-verification enforcement was added.
 * Safe to run on every startup — Drizzle+Turso is idempotent here.        */
try {
  const { db, usersTable, eq } = await import("@workspace/db");
  await db.update(usersTable).set({ emailVerified: 1 }).where(eq(usersTable.emailVerified, 0));
  logger.info("Email-verification migration: pre-existing users marked verified");
} catch (err) {
  logger.warn({ err }, "Email-verification migration failed (non-fatal)");
}

/* Seed static content into DB if not already present */
try {
  await seedContent();
} catch (err) {
  logger.warn({ err }, "Content seeding encountered an error (non-fatal)");
}

/* Seed master account once if MASTER_EMAIL/MASTER_PASSWORD are set */
await seedMasterAccount();

/* Start background job — expires overdue active subscriptions every 5 min */
startSubscriptionExpiryJob();

/* Start background job — warns users 3 days before subscription expires (every 6h) */
startSubscriptionExpiryWarningJob();

/* Start background job — purges receipt data 2 business days after decision */
startReceiptPurgeJob();

/* Start background job — deletes expired rows from the JWT blocklist every hour */
startTokenCleanupJob();

app.listen(port, (err: any) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
