import { z } from "zod";

/* ── Auth ────────────────────────────────────────────────────────────────── */

export const RegisterBody = z.object({
  name:     z.string().min(1, "Nome obrigatório").max(100).trim(),
  email:    z.string().email("E-mail inválido").max(254).toLowerCase(),
  password: z.string().min(8, "Password deve ter pelo menos 8 caracteres").max(200),
});

export const LoginBody = z.object({
  email:    z.string().email("E-mail inválido").max(254).toLowerCase(),
  password: z.string().min(1, "Password obrigatória").max(200),
});

/* ── Admin ───────────────────────────────────────────────────────────────── */

export const AdminLoginBody = z.object({
  passwordHash: z.string().min(1).max(512),
});

export const AdminRejectBody = z.object({
  notes: z.string().max(500).optional(),
});

export const AdminXpBody = z.object({
  xp: z.number({ invalid_type_error: "xp must be a number" }).int().nonnegative().max(10_000_000),
});

/* ── Subscription ────────────────────────────────────────────────────────── */

const ALLOWED_RECEIPT_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const;

const ReceiptFields = {
  paymentReference: z.string().max(500).trim().optional(),
  receiptData:      z
    .string()
    .max(7_000_000, "Comprovativo demasiado grande (máx. 5 MB)")
    .regex(/^[A-Za-z0-9+/=]+$/, "receiptData deve ser Base64 válido")
    .optional(),
  receiptMimeType:  z.enum(ALLOWED_RECEIPT_TYPES, {
    errorMap: () => ({ message: "Tipo de ficheiro não suportado (use JPG, PNG, WebP ou PDF)" }),
  }).optional(),
  receiptFilename:  z.string().max(255).trim().optional(),
};

export const SubscriptionRequestBody = z
  .object(ReceiptFields)
  .refine(
    (d) => !d.receiptData || d.receiptMimeType,
    { message: "receiptMimeType é obrigatório quando receiptData está presente" },
  );

export const SubscriptionReferenceBody = z
  .object(ReceiptFields)
  .refine(
    (d) => Boolean(d.paymentReference || d.receiptData),
    { message: "paymentReference ou receiptData é obrigatório" },
  )
  .refine(
    (d) => !d.receiptData || d.receiptMimeType,
    { message: "receiptMimeType é obrigatório quando receiptData está presente" },
  );

/* ── Trades ──────────────────────────────────────────────────────────────── */

export const TradeItem = z.object({
  id:          z.string().min(1).max(128),
  symbol:      z.string().min(1).max(20),
  side:        z.enum(["buy", "sell"]),
  size:        z.number({ invalid_type_error: "size must be a number" }).positive().max(1_000_000_000),
  entryPrice:  z.number({ invalid_type_error: "entryPrice must be a number" }).nonnegative().max(1_000_000_000),
  exitPrice:   z.number({ invalid_type_error: "exitPrice must be a number" }).nonnegative().max(1_000_000_000),
  pnl:         z.number({ invalid_type_error: "pnl must be a number" }).min(-1_000_000_000).max(1_000_000_000),
  openedAt:    z.number().int().nonnegative().max(9_999_999_999_999),
  closedAt:    z.number().int().nonnegative().max(9_999_999_999_999),
  reason:      z.string().max(100),
  leverage:    z.number().positive().max(1000).optional(),
  stopLoss:    z.number().nonnegative().max(1_000_000_000).nullable().optional(),
  takeProfit:  z.number().nonnegative().max(1_000_000_000).nullable().optional(),
  note:        z.string().max(1000).nullable().optional(),
});

export const TradesBody = z.union([TradeItem, z.array(TradeItem).max(500)]);

/* ── Progress ────────────────────────────────────────────────────────────── */

const MAX_XP          = 10_000_000;
const MAX_STREAK      = 3650;          // 10 years
const MAX_QUIZ_SCORE  = 100;
const MAX_LIST_ITEMS  = 1000;

export const ProgressBody = z.object({
  xp:               z.number().int().nonnegative().max(MAX_XP).optional(),
  streakDays:       z.number().int().nonnegative().max(MAX_STREAK).optional(),
  lastActivityDay:  z.string().max(10).nullable().optional(),
  perfectQuizCount: z.number().int().nonnegative().max(MAX_LIST_ITEMS).optional(),
  missionDate:      z.string().max(10).nullable().optional(),
  completedLessons: z.array(z.string().max(128)).max(MAX_LIST_ITEMS).optional(),
  quizScores:       z.record(z.string().max(128), z.number().min(0).max(MAX_QUIZ_SCORE)).optional(),
  achievements:     z.array(z.string().max(128)).max(MAX_LIST_ITEMS).optional(),
  reviewQueue:      z.array(z.string().max(128)).max(MAX_LIST_ITEMS).optional(),
  dailyMissions:    z.array(z.unknown()).max(50).optional(),
  onboarded:        z.boolean().optional(),
  userLevel:        z.enum(["iniciante", "intermediario", "avancado"]).nullable().optional(),
  userInterests:    z.array(z.string().max(64)).max(50).optional(),
  settings:         z.record(z.string().max(64), z.unknown()).optional(),
  booksProgress:    z.record(z.string().max(128), z.unknown()).optional(),
  seenAchievements: z.array(z.string().max(128)).max(MAX_LIST_ITEMS).optional(),
  watchedVideos:    z.array(z.string().max(128)).max(MAX_LIST_ITEMS).optional(),
  simCashBalance:   z.number().nonnegative().max(1_000_000_000).optional(),
});

/* ── Duelos ──────────────────────────────────────────────────────────────── */

export const DueloCreateBody = z.object({
  title:          z.string().min(1).max(200).trim(),
  targetEquity:   z.number().nonnegative().max(1_000_000_000),
  startBalance:   z.number().nonnegative().max(1_000_000_000),
  maxDrawdownPct: z.number().min(0).max(100),
  maxTrades:      z.number().int().nonnegative().max(10_000),
  expiresAt:      z.number().int().nonnegative().max(9_999_999_999_999),
  code:           z.string().max(500).optional(),
  startEquity:    z.number().nonnegative().max(1_000_000_000).optional(),
  accepted:       z.boolean().optional(),
});

export const DueloPatchBody = z.object({
  accepted:    z.boolean().optional(),
  startEquity: z.number().nonnegative().max(1_000_000_000).optional(),
}).strip();
