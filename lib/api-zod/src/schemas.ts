import { z } from "zod";

/* ── Auth ────────────────────────────────────────────────────────────────── */

export const RegisterBody = z.object({
  id:       z.string().min(1).max(128),
  name:     z.string().min(1, "Nome obrigatório").max(100).trim(),
  email:    z.string().email("E-mail inválido"),
  password: z.string().min(6, "Password deve ter pelo menos 6 caracteres").max(200),
});

export const LoginBody = z.object({
  email:    z.string().email("E-mail inválido"),
  password: z.string().min(1, "Password obrigatória"),
});

/* ── Admin ───────────────────────────────────────────────────────────────── */

export const AdminLoginBody = z.object({
  passwordHash: z.string().min(1),
});

export const AdminRejectBody = z.object({
  notes: z.string().max(500).optional(),
});

export const AdminXpBody = z.object({
  xp: z.number({ invalid_type_error: "xp must be a number" }).int().nonnegative(),
});

/* ── Subscription ────────────────────────────────────────────────────────── */

export const SubscriptionRequestBody = z.object({
  paymentReference: z.string().max(500).optional(),
  receiptData:      z.string().optional(),
  receiptMimeType:  z.string().max(100).optional(),
  receiptFilename:  z.string().max(255).optional(),
});

export const SubscriptionReferenceBody = z
  .object({
    paymentReference: z.string().max(500).optional(),
    receiptData:      z.string().optional(),
    receiptMimeType:  z.string().max(100).optional(),
    receiptFilename:  z.string().max(255).optional(),
  })
  .refine(
    (d) => Boolean(d.paymentReference || d.receiptData),
    { message: "paymentReference ou receiptData é obrigatório" },
  );

/* ── Trades ──────────────────────────────────────────────────────────────── */

export const TradeItem = z.object({
  id:          z.string().min(1).max(128),
  symbol:      z.string().min(1).max(20),
  side:        z.enum(["buy", "sell"]),
  size:        z.number({ invalid_type_error: "size must be a number" }).positive(),
  entryPrice:  z.number({ invalid_type_error: "entryPrice must be a number" }).nonnegative(),
  exitPrice:   z.number({ invalid_type_error: "exitPrice must be a number" }).nonnegative(),
  pnl:         z.number({ invalid_type_error: "pnl must be a number" }),
  openedAt:    z.number().int(),
  closedAt:    z.number().int(),
  reason:      z.string().max(100),
  leverage:    z.number().positive().max(1000).optional(),
  stopLoss:    z.number().nonnegative().nullable().optional(),
  takeProfit:  z.number().nonnegative().nullable().optional(),
  note:        z.string().max(1000).nullable().optional(),
});

export const TradesBody = z.union([TradeItem, z.array(TradeItem)]);

/* ── Progress ────────────────────────────────────────────────────────────── */

export const ProgressBody = z.object({
  xp:               z.number().int().nonnegative().optional(),
  streakDays:       z.number().int().nonnegative().optional(),
  lastActivityDay:  z.string().nullable().optional(),
  perfectQuizCount: z.number().int().nonnegative().optional(),
  missionDate:      z.string().nullable().optional(),
  completedLessons: z.array(z.string()).optional(),
  quizScores:       z.record(z.string(), z.number()).optional(),
  achievements:     z.array(z.string()).optional(),
  reviewQueue:      z.array(z.string()).optional(),
  dailyMissions:    z.array(z.unknown()).optional(),
  onboarded:        z.boolean().optional(),
  userLevel:        z.string().nullable().optional(),
  userInterests:    z.array(z.string()).optional(),
  settings:         z.record(z.string(), z.unknown()).optional(),
  booksProgress:    z.record(z.string(), z.unknown()).optional(),
  seenAchievements: z.array(z.string()).optional(),
  watchedVideos:    z.array(z.string()).optional(),
  simCashBalance:   z.number().nonnegative().optional(),
});

/* ── Duelos ──────────────────────────────────────────────────────────────── */

export const DueloBody = z.object({
  opponentId:   z.string().min(1).max(128),
  opponentName: z.string().min(1).max(100),
  winnerId:     z.string().nullable().optional(),
  xpGained:     z.number().int().nonnegative().optional(),
  status:       z.enum(["pending", "active", "finished"]).optional(),
});
