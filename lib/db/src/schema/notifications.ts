import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * notifications
 * In-app notifications — mirrors AppNotification in the Zustand store.
 */
export const notificationsTable = sqliteTable("notifications", {
  id:        text("id").primaryKey(),           // "notif_<ts>_<rand>"
  userId:    text("user_id").notNull(),
  type:      text("type").notNull(),            // "achievement" | "mission" | "market" | "system" | "duelo"
  title:     text("title").notNull(),
  message:   text("message").notNull(),
  link:      text("link"),
  isRead:    integer("is_read").notNull().default(0),   // 0 = unread, 1 = read (SQLite bool)
  createdAt: integer("created_at").notNull(),           // Unix ms
});

export const insertNotificationSchema = createInsertSchema(notificationsTable).omit({ id: true });
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification       = typeof notificationsTable.$inferSelect;
