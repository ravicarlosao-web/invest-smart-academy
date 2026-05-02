import { drizzle } from "drizzle-orm/libsql/http";
import { sql } from "drizzle-orm";
import * as schema from "./schema/index.js";

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

    /* ── Content tables ─────────────────────────────────────────────────── */
    sql.raw(`CREATE TABLE IF NOT EXISTS glossary_terms (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      term        TEXT NOT NULL,
      definition  TEXT NOT NULL,
      category    TEXT NOT NULL,
      sort_order  INTEGER NOT NULL DEFAULT 0,
      created_at  INTEGER NOT NULL,
      updated_at  INTEGER NOT NULL
    )`),

    sql.raw(`CREATE TABLE IF NOT EXISTS strategies (
      id              TEXT PRIMARY KEY,
      name            TEXT NOT NULL,
      subtitle        TEXT NOT NULL,
      icon            TEXT NOT NULL,
      timeframes      TEXT NOT NULL DEFAULT '[]',
      markets         TEXT NOT NULL DEFAULT '[]',
      risk_level      TEXT NOT NULL,
      win_rate        TEXT NOT NULL,
      risk_reward     TEXT NOT NULL,
      difficulty      TEXT NOT NULL,
      description     TEXT NOT NULL,
      how_it_works    TEXT NOT NULL,
      setup           TEXT NOT NULL DEFAULT '[]',
      entry_signals   TEXT NOT NULL DEFAULT '[]',
      exit_signals    TEXT NOT NULL DEFAULT '[]',
      risk_management TEXT NOT NULL DEFAULT '[]',
      pros            TEXT NOT NULL DEFAULT '[]',
      cons            TEXT NOT NULL DEFAULT '[]',
      example         TEXT NOT NULL,
      tags            TEXT NOT NULL DEFAULT '[]',
      sort_order      INTEGER NOT NULL DEFAULT 0,
      created_at      INTEGER NOT NULL,
      updated_at      INTEGER NOT NULL
    )`),

    sql.raw(`CREATE TABLE IF NOT EXISTS books (
      id          TEXT PRIMARY KEY,
      order_num   INTEGER NOT NULL,
      title       TEXT NOT NULL,
      author      TEXT NOT NULL,
      cover       TEXT NOT NULL,
      category    TEXT NOT NULL,
      description TEXT NOT NULL,
      pages       INTEGER NOT NULL,
      docx_file   TEXT,
      content     TEXT,
      created_at  INTEGER NOT NULL,
      updated_at  INTEGER NOT NULL
    )`),

    sql.raw(`CREATE TABLE IF NOT EXISTS resource_sections (
      id         TEXT PRIMARY KEY,
      title      TEXT NOT NULL,
      icon       TEXT NOT NULL,
      color      TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`),

    sql.raw(`CREATE TABLE IF NOT EXISTS resource_items (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      section_id  TEXT NOT NULL,
      name        TEXT NOT NULL,
      description TEXT NOT NULL,
      url         TEXT,
      badge       TEXT,
      stars       INTEGER,
      tags        TEXT NOT NULL DEFAULT '[]',
      sort_order  INTEGER NOT NULL DEFAULT 0,
      created_at  INTEGER NOT NULL,
      updated_at  INTEGER NOT NULL
    )`),

    sql.raw(`CREATE TABLE IF NOT EXISTS curriculum_levels (
      id          INTEGER PRIMARY KEY,
      title       TEXT NOT NULL,
      subtitle    TEXT NOT NULL,
      difficulty  TEXT NOT NULL,
      sort_order  INTEGER NOT NULL DEFAULT 0,
      created_at  INTEGER NOT NULL,
      updated_at  INTEGER NOT NULL
    )`),

    sql.raw(`CREATE TABLE IF NOT EXISTS curriculum_lessons (
      id         TEXT PRIMARY KEY,
      level_id   INTEGER NOT NULL,
      title      TEXT NOT NULL,
      summary    TEXT NOT NULL,
      xp         INTEGER NOT NULL DEFAULT 0,
      content    TEXT NOT NULL DEFAULT '[]',
      questions  TEXT NOT NULL DEFAULT '[]',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`),

    sql.raw(`CREATE TABLE IF NOT EXISTS revoked_tokens (
      jti        TEXT PRIMARY KEY,
      expires_at INTEGER NOT NULL,
      revoked_at INTEGER NOT NULL
    )`),
  ];

  for (const stmt of statements) {
    await db.run(stmt);
  }

  // Add new columns to existing tables (idempotent — errors ignored if column already exists)
  const alterStatements = [
    `ALTER TABLE duelos ADD COLUMN opponent_user_id TEXT`,
    `ALTER TABLE subscriptions ADD COLUMN receipt_data TEXT`,
    `ALTER TABLE subscriptions ADD COLUMN receipt_mime_type TEXT`,
    `ALTER TABLE subscriptions ADD COLUMN receipt_filename TEXT`,
    `ALTER TABLE subscriptions ADD COLUMN receipt_purge_at INTEGER`,
    `ALTER TABLE users ADD COLUMN google_id TEXT`,
    `ALTER TABLE users ADD COLUMN updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)`,
  ];
  for (const stmt of alterStatements) {
    try {
      await db.run(sql.raw(stmt));
    } catch {
      // Column already exists — ignore
    }
  }
}

export * from "./schema/index.js";

/* Re-export drizzle-orm query helpers so consumers don't need their own copy */
export { eq, and, or, not, desc, asc, sql, inArray, isNull, isNotNull, lt, lte, gt, gte } from "drizzle-orm";
