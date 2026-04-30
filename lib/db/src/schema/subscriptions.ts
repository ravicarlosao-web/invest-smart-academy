import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * subscriptions
 * Manual payment subscription management — 5.000 AOA/mês.
 * Status flow: pending → active → expired | rejected
 */
export const subscriptionsTable = sqliteTable("subscriptions", {
  id:               text("id").primaryKey(),              // "sub_<ts>_<rand>"
  userId:           text("user_id").notNull(),
  status:           text("status").notNull().default("pending"), // "pending" | "active" | "expired" | "rejected"
  amount:           integer("amount").notNull().default(5000),   // AOA
  paymentReference: text("payment_reference"),            // referência bancária fornecida pelo aluno
  notes:            text("notes"),                        // notas do admin (motivo de rejeição, etc.)
  createdAt:        integer("created_at").notNull(),      // Unix ms — quando o aluno pediu
  expiresAt:        integer("expires_at"),                // Unix ms — data de expiração (30 dias após aprovação)
  approvedAt:       integer("approved_at"),               // Unix ms — quando o admin aprovou
  updatedAt:        integer("updated_at").notNull(),
});

export const insertSubscriptionSchema: z.ZodObject<any> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (createInsertSchema(subscriptionsTable) as any).omit({ id: true });

export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription       = typeof subscriptionsTable.$inferSelect;
