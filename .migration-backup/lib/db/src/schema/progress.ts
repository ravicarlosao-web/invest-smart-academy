import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * progress
 * One row per user — mirrors Zustand ProgressState + onboarding + settings.
 * JSON columns store arrays / objects serialised as text.
 */
export const progressTable = sqliteTable("progress", {
  userId:           text("user_id").primaryKey(),
  xp:               integer("xp").notNull().default(0),
  streakDays:       integer("streak_days").notNull().default(0),
  lastActivityDay:  text("last_activity_day"),
  perfectQuizCount: integer("perfect_quiz_count").notNull().default(0),
  missionDate:      text("mission_date"),
  completedLessons: text("completed_lessons").notNull().default("[]"),
  quizScores:       text("quiz_scores").notNull().default("{}"),
  achievements:     text("achievements").notNull().default("[]"),
  reviewQueue:      text("review_queue").notNull().default("[]"),
  dailyMissions:    text("daily_missions").notNull().default("[]"),
  // onboarding
  onboarded:        integer("onboarded").notNull().default(0),
  userLevel:        text("user_level"),
  userInterests:    text("user_interests").notNull().default("[]"),
  // settings
  settings:         text("settings").notNull().default("{}"),
  // extra app state
  booksProgress:    text("books_progress").notNull().default("{}"),
  seenAchievements: text("seen_achievements").notNull().default("[]"),
  watchedVideos:    text("watched_videos").notNull().default("[]"),
  // sim balance (restored on login)
  simCashBalance:   real("sim_cash_balance").notNull().default(10000),
  updatedAt:        integer("updated_at").notNull(),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const insertProgressSchema: z.ZodObject<any> = createInsertSchema(progressTable) as any;
export type InsertProgress = z.infer<typeof insertProgressSchema>;
export type Progress       = typeof progressTable.$inferSelect;
