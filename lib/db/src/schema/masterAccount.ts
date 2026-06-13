import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/**
 * master_account
 * Stores the single Master account credentials.
 * Created once via seed — never via user-facing registration.
 */
export const masterAccountTable = sqliteTable("master_account", {
  id:           text("id").primaryKey(),
  email:        text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt:    integer("created_at").notNull(),
});

export type MasterAccount = typeof masterAccountTable.$inferSelect;
