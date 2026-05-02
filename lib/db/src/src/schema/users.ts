import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const usersTable = sqliteTable("users", {
  id:            text("id").primaryKey(),
  name:          text("name"),
  email:         text("email"),
  passwordHash:  text("password_hash"),
  googleId:      text("google_id"),
  emailVerified: integer("email_verified").notNull().default(0),
  createdAt:     integer("created_at").notNull(),
  updatedAt:     integer("updated_at").notNull(),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const insertUserSchema: z.ZodObject<any> = createInsertSchema(usersTable) as any;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User       = typeof usersTable.$inferSelect;
