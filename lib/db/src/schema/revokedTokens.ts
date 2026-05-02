import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/**
 * revoked_tokens
 * JWT blocklist — one row per revoked JTI.
 * Rows are deleted by the cleanup job once expires_at has passed.
 */
export const revokedTokensTable = sqliteTable("revoked_tokens", {
  jti:       text("jti").primaryKey(),
  expiresAt: integer("expires_at").notNull(),
  revokedAt: integer("revoked_at").notNull(),
});

export type RevokedToken = typeof revokedTokensTable.$inferSelect;
