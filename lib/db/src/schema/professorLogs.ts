import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const professorLogsTable = sqliteTable("professor_logs", {
  id:             text("id").primaryKey(),
  professorId:    text("professor_id").notNull(),
  professorName:  text("professor_name").notNull(),
  professorEmail: text("professor_email").notNull(),
  action:         text("action").notNull(),        // "added" | "removed" | "updated"
  resourceType:   text("resource_type").notNull(), // "strategy" | "book" | "glossary" | "resource" | "video" | "curriculum_level" | "curriculum_lesson"
  resourceName:   text("resource_name").notNull(),
  details:        text("details"),                 // JSON string, optional
  createdAt:      integer("created_at").notNull(), // Unix ms
});
