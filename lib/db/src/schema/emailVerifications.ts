import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const emailVerificationsTable = sqliteTable("email_verifications", {
  id:        text("id").primaryKey(),
  userId:    text("user_id").notNull(),
  email:     text("email").notNull(),
  code:      text("code").notNull(),
  expiresAt: integer("expires_at").notNull(),
  used:      integer("used").notNull().default(0),
  createdAt: integer("created_at").notNull(),
});

export type EmailVerification = typeof emailVerificationsTable.$inferSelect;
