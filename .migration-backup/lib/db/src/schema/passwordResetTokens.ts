import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/**
 * password_reset_tokens
 * One row per active reset request. Expires after 1 hour.
 */
export const passwordResetTokensTable = sqliteTable("password_reset_tokens", {
  token:     text("token").primaryKey(),
  userId:    text("user_id").notNull(),
  expiresAt: integer("expires_at").notNull(),
  usedAt:    integer("used_at"),
  createdAt: integer("created_at").notNull(),
});

export type PasswordResetToken = typeof passwordResetTokensTable.$inferSelect;
