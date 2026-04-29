import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * trades
 * Closed positions from the simulator.
 * Maps 1-to-1 with ClosedTrade in the Zustand store.
 */
export const tradesTable = sqliteTable("trades", {
  id:         text("id").primaryKey(),          // "pos_<ts>_<rand>"
  userId:     text("user_id").notNull(),
  symbol:     text("symbol").notNull(),
  side:       text("side").notNull(),           // "buy" | "sell"
  size:       real("size").notNull(),
  entryPrice: real("entry_price").notNull(),
  exitPrice:  real("exit_price").notNull(),
  pnl:        real("pnl").notNull(),
  openedAt:   integer("opened_at").notNull(),   // Unix ms
  closedAt:   integer("closed_at").notNull(),   // Unix ms
  reason:     text("reason").notNull(),         // "manual" | "stop" | "target" | "liquidation"
  leverage:   real("leverage").notNull().default(1),
  stopLoss:   real("stop_loss"),
  takeProfit: real("take_profit"),
  note:       text("note"),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const insertTradeSchema: z.ZodObject<any> = (createInsertSchema(tradesTable) as any).omit({ id: true });
export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Trade       = typeof tradesTable.$inferSelect;
