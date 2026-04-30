import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/**
 * admin_settings
 * Generic key/value store for admin overrides (e.g. curriculum patches,
 * feature flags). Values are arbitrary JSON serialised as text.
 */
export const adminSettingsTable = sqliteTable("admin_settings", {
  key:       text("key").primaryKey(),
  value:     text("value").notNull().default("{}"),
  updatedAt: integer("updated_at").notNull(),
});

export type AdminSetting = typeof adminSettingsTable.$inferSelect;
