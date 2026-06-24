import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * subscriptions
 * Manual payment subscription management.
 * Status flow: pending → active → expired | rejected
 */
export const subscriptionsTable = sqliteTable("subscriptions", {
  id:               text("id").primaryKey(),              // "sub_<ts>_<rand>"
  userId:           text("user_id").notNull(),
  planId:           text("plan_id"),                      // FK → plans.id (nullable para subs antigas)
  status:           text("status").notNull().default("pending"), // "pending" | "active" | "expired" | "rejected"
  amount:           integer("amount").notNull().default(15000),  // AOA — valor capturado no momento do pedido
  durationDays:     integer("duration_days"),             // duração em dias capturada no momento do pedido
  paymentReference: text("payment_reference"),            // referência bancária fornecida pelo aluno
  receiptData:      text("receipt_data"),                 // base64 do comprovativo (PDF/imagem)
  receiptMimeType:  text("receipt_mime_type"),            // ex: "image/jpeg", "application/pdf"
  receiptFilename:  text("receipt_filename"),             // nome original do ficheiro
  notes:            text("notes"),                        // notas do admin (motivo de rejeição, etc.)
  createdAt:        integer("created_at").notNull(),      // Unix ms — quando o aluno pediu
  expiresAt:        integer("expires_at"),                // Unix ms — data de expiração
  approvedAt:       integer("approved_at"),               // Unix ms — quando o admin aprovou
  receiptPurgeAt:   integer("receipt_purge_at"),          // Unix ms — quando o comprovativo deve ser apagado
  updatedAt:        integer("updated_at").notNull(),
});

export const insertSubscriptionSchema: z.ZodObject<any> =
  (createInsertSchema(subscriptionsTable) as any).omit({ id: true });

export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription       = typeof subscriptionsTable.$inferSelect;
