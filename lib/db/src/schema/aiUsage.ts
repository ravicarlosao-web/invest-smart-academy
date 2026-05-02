import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const aiUsageTable = sqliteTable("ai_usage", {
  userId:      text("user_id").primaryKey(),
  usageCount:  integer("usage_count").notNull().default(0),
  lastUsedAt:  integer("last_used_at"),
});

export type AiUsage = typeof aiUsageTable.$inferSelect;
