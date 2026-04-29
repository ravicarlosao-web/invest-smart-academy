import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * progress
 * One row per user — mirrors Zustand ProgressState.
 * JSON columns store arrays / objects serialised as text.
 */
export const progressTable = sqliteTable("progress", {
  userId:           text("user_id").primaryKey(),
  xp:               integer("xp").notNull().default(0),
  streakDays:       integer("streak_days").notNull().default(0),
  lastActivityDay:  text("last_activity_day"),            // "YYYY-MM-DD" | null
  perfectQuizCount: integer("perfect_quiz_count").notNull().default(0),
  missionDate:      text("mission_date"),                 // "YYYY-MM-DD" | null
  // JSON-serialised arrays / objects
  completedLessons: text("completed_lessons").notNull().default("[]"),
  quizScores:       text("quiz_scores").notNull().default("{}"),
  achievements:     text("achievements").notNull().default("[]"),
  reviewQueue:      text("review_queue").notNull().default("[]"),
  dailyMissions:    text("daily_missions").notNull().default("[]"),
  updatedAt:        integer("updated_at").notNull(),
});

export const insertProgressSchema = createInsertSchema(progressTable);
export type InsertProgress = z.infer<typeof insertProgressSchema>;
export type Progress       = typeof progressTable.$inferSelect;
