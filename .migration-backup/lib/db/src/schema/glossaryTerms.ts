import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const glossaryTermsTable = sqliteTable("glossary_terms", {
  id:         integer("id").primaryKey({ autoIncrement: true }),
  term:       text("term").notNull(),
  definition: text("definition").notNull(),
  category:   text("category").notNull(),
  sortOrder:  integer("sort_order").notNull().default(0),
  createdAt:  integer("created_at").notNull(),
  updatedAt:  integer("updated_at").notNull(),
});
