import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const curriculumLevelsTable = sqliteTable("curriculum_levels", {
  id:         integer("id").primaryKey(),
  title:      text("title").notNull(),
  subtitle:   text("subtitle").notNull(),
  difficulty: text("difficulty").notNull(),
  sortOrder:  integer("sort_order").notNull().default(0),
  createdAt:  integer("created_at").notNull(),
  updatedAt:  integer("updated_at").notNull(),
});

export const curriculumLessonsTable = sqliteTable("curriculum_lessons", {
  id:        text("id").primaryKey(),
  levelId:   integer("level_id").notNull(),
  title:     text("title").notNull(),
  summary:   text("summary").notNull(),
  xp:        integer("xp").notNull().default(0),
  content:   text("content").notNull().default("[]"),
  questions: text("questions").notNull().default("[]"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});
