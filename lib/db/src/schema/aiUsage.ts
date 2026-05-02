import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const aiUsageTable = sqliteTable("ai_usage", {
  userId:              text("user_id").primaryKey(),
  usageCount:          integer("usage_count").notNull().default(0),          // legacy total (kept for compat)
  chartAnalysisCount:  integer("chart_analysis_count").notNull().default(0), // análise de gráfico
  tradeFeedbackCount:  integer("trade_feedback_count").notNull().default(0), // feedback de trade
  lastUsedAt:          integer("last_used_at"),
});

export type AiUsage = typeof aiUsageTable.$inferSelect;
