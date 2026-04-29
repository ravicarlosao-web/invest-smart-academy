import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * duelos
 * Social challenges between users — mirrors DueloEntry in the Zustand store.
 */
export const duelosTable = sqliteTable("duelos", {
  id:              text("id").primaryKey(),        // "duelo_<ts>_<rand>"
  userId:          text("user_id").notNull(),
  title:           text("title").notNull(),
  targetEquity:    real("target_equity").notNull(),
  startBalance:    real("start_balance").notNull(),
  maxDrawdownPct:  real("max_drawdown_pct").notNull(),
  maxTrades:       integer("max_trades").notNull(),
  expiresAt:       integer("expires_at").notNull(),   // Unix ms
  createdAt:       integer("created_at").notNull(),   // Unix ms
  startEquity:     real("start_equity").notNull().default(0),
  accepted:        integer("accepted").notNull().default(0),  // 0 | 1
  code:            text("code").notNull().unique(),
});

export const insertDueloSchema = createInsertSchema(duelosTable).omit({ id: true });
export type InsertDuelo = z.infer<typeof insertDueloSchema>;
export type Duelo       = typeof duelosTable.$inferSelect;
