import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const resourceSectionsTable = sqliteTable("resource_sections", {
  id:        text("id").primaryKey(),
  title:     text("title").notNull(),
  icon:      text("icon").notNull(),
  color:     text("color").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const resourceItemsTable = sqliteTable("resource_items", {
  id:          integer("id").primaryKey({ autoIncrement: true }),
  sectionId:   text("section_id").notNull(),
  name:        text("name").notNull(),
  description: text("description").notNull(),
  url:         text("url"),
  badge:       text("badge"),
  stars:       integer("stars"),
  tags:        text("tags").notNull().default("[]"),
  sortOrder:   integer("sort_order").notNull().default(0),
  createdAt:   integer("created_at").notNull(),
  updatedAt:   integer("updated_at").notNull(),
});
