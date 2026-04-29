import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * users
 * One row per registered account.
 */
export const usersTable = sqliteTable("users", {
  id:           text("id").primaryKey(),
  name:         text("name"),
  email:        text("email"),
  passwordHash: text("password_hash"),
  createdAt:    integer("created_at").notNull(),
  updatedAt:    integer("updated_at").notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User       = typeof usersTable.$inferSelect;
