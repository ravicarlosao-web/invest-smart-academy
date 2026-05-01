import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const booksTable = sqliteTable("books", {
  id:          text("id").primaryKey(),
  orderNum:    integer("order_num").notNull(),
  title:       text("title").notNull(),
  author:      text("author").notNull(),
  cover:       text("cover").notNull(),
  category:    text("category").notNull(),
  description: text("description").notNull(),
  pages:       integer("pages").notNull(),
  docxFile:    text("docx_file"),
  content:     text("content"),
  createdAt:   integer("created_at").notNull(),
  updatedAt:   integer("updated_at").notNull(),
});
