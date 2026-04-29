import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * users
 * One row per anonymous session (identified by a UUID stored in localStorage).
 * No real authentication — anonymous_id is generated on first app load.
 */
export const usersTable = sqliteTable("users", {
  id:          text("id").primaryKey(),           // UUID
  anonymousId: text("anonymous_id").notNull().unique(),
  createdAt:   integer("created_at").notNull(),   // Unix ms
  updatedAt:   integer("updated_at").notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User       = typeof usersTable.$inferSelect;
