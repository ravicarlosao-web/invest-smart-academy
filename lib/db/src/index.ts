import { drizzle } from "drizzle-orm/libsql/http";
import { sql } from "drizzle-orm";
import * as schema from "./schema";

const rawUrl    = process.env["TURSO_DATABASE_URL"];
const tursoToken = process.env["TURSO_AUTH_TOKEN"];

if (!rawUrl) {
  throw new Error(
    "TURSO_DATABASE_URL must be set. " +
    "Create a database at turso.tech and set the secret in the Replit Secrets tab.",
  );
}

/* Turso URLs use the libsql:// scheme; the HTTP-only client needs https:// */
const tursoUrl = rawUrl.replace(/^libsql:\/\//, "https://");

export const db = drizzle({
  connection: { url: tursoUrl, authToken: tursoToken ?? undefined },
  schema,
});

/**
 * Ensures all required tables exist in Turso.
 * Safe to call on every startup — uses CREATE TABLE IF NOT EXISTS.
 */
export async function initDb(): Promise<void> {
  const statements = [
    sql.raw(`CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      name        TEXT,
      email       TEXT UNIQUE,
      password_hash TEXT,
      created_at  INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    )`),
    sql.raw(`CREATE TABLE IF NOT EXISTS progress (
      user_id           TEXT PRIMARY KEY,
      xp                INTEGER NOT NULL DEFAULT 0,
      streak_days       INTEGER NOT NULL DEFAULT 0,
      last_activity_day TEXT,
      completed_lessons TEXT NOT NULL DEFAULT '[]',
      sim_cash_balance  REAL NOT NULL DEFAULT 10000,
      onboarded         INTEGER NOT NULL DEFAULT 0
    )`),
    sql.raw(`CREATE TABLE IF NOT EXISTS trades (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL,
      asset       TEXT,
      direction   TEXT,
      size        REAL,
      entry_price REAL,
      exit_price  REAL,
      pnl         REAL,
      reason      TEXT,
      opened_at   INTEGER,
      closed_at   INTEGER
    )`),
    sql.raw(`CREATE TABLE IF NOT EXISTS notifications (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL,
      type        TEXT,
      title       TEXT,
      body        TEXT,
      read        INTEGER NOT NULL DEFAULT 0,
      created_at  INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    )`),
    sql.raw(`CREATE TABLE IF NOT EXISTS duelos (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL,
      code        TEXT UNIQUE,
      status      TEXT NOT NULL DEFAULT 'pending',
      data        TEXT NOT NULL DEFAULT '{}',
      created_at  INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    )`),
    sql.raw(`CREATE TABLE IF NOT EXISTS admin_settings (
      key         TEXT PRIMARY KEY,
      value       TEXT NOT NULL DEFAULT '{}',
      updated_at  INTEGER NOT NULL
    )`),
    sql.raw(`CREATE TABLE IF NOT EXISTS subscriptions (
      id                TEXT PRIMARY KEY,
      user_id           TEXT NOT NULL,
      status            TEXT NOT NULL DEFAULT 'pending',
      amount            INTEGER NOT NULL DEFAULT 5000,
      payment_reference TEXT,
      notes             TEXT,
      created_at        INTEGER NOT NULL,
      expires_at        INTEGER,
      approved_at       INTEGER,
      updated_at        INTEGER NOT NULL
    )`),
  ];

  for (const stmt of statements) {
    await db.run(stmt);
  }

  // Add new columns to existing tables (idempotent — errors ignored if column already exists)
  const alterStatements = [
    `ALTER TABLE subscriptions ADD COLUMN receipt_data TEXT`,
    `ALTER TABLE subscriptions ADD COLUMN receipt_mime_type TEXT`,
    `ALTER TABLE subscriptions ADD COLUMN receipt_filename TEXT`,
  ];
  for (const stmt of alterStatements) {
    try {
      await db.run(sql.raw(stmt));
    } catch {
      // Column already exists — ignore
    }
  }
}

export * from "./schema";

/* Re-export drizzle-orm query helpers so consumers don't need their own copy */
export { eq, and, or, not, desc, asc, sql, inArray, isNull, isNotNull } from "drizzle-orm";
