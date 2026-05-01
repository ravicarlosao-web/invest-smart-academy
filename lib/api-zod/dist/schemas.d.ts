import { z } from "zod";
export declare const RegisterBody: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    email: string;
    password: string;
}, {
    id: string;
    name: string;
    email: string;
    password: string;
}>;
export declare const LoginBody: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const AdminLoginBody: z.ZodObject<{
    passwordHash: z.ZodString;
}, "strip", z.ZodTypeAny, {
    passwordHash: string;
}, {
    passwordHash: string;
}>;
export declare const AdminRejectBody: z.ZodObject<{
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    notes?: string | undefined;
}, {
    notes?: string | undefined;
}>;
export declare const AdminXpBody: z.ZodObject<{
    xp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    xp: number;
}, {
    xp: number;
}>;
export declare const SubscriptionRequestBody: z.ZodEffects<z.ZodObject<{
    paymentReference: z.ZodOptional<z.ZodString>;
    receiptData: z.ZodOptional<z.ZodString>;
    receiptMimeType: z.ZodOptional<z.ZodEnum<["image/jpeg", "image/png", "image/webp", "application/pdf"]>>;
    receiptFilename: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    paymentReference?: string | undefined;
    receiptData?: string | undefined;
    receiptMimeType?: "image/jpeg" | "image/png" | "image/webp" | "application/pdf" | undefined;
    receiptFilename?: string | undefined;
}, {
    paymentReference?: string | undefined;
    receiptData?: string | undefined;
    receiptMimeType?: "image/jpeg" | "image/png" | "image/webp" | "application/pdf" | undefined;
    receiptFilename?: string | undefined;
}>, {
    paymentReference?: string | undefined;
    receiptData?: string | undefined;
    receiptMimeType?: "image/jpeg" | "image/png" | "image/webp" | "application/pdf" | undefined;
    receiptFilename?: string | undefined;
}, {
    paymentReference?: string | undefined;
    receiptData?: string | undefined;
    receiptMimeType?: "image/jpeg" | "image/png" | "image/webp" | "application/pdf" | undefined;
    receiptFilename?: string | undefined;
}>;
export declare const SubscriptionReferenceBody: z.ZodEffects<z.ZodEffects<z.ZodObject<{
    paymentReference: z.ZodOptional<z.ZodString>;
    receiptData: z.ZodOptional<z.ZodString>;
    receiptMimeType: z.ZodOptional<z.ZodEnum<["image/jpeg", "image/png", "image/webp", "application/pdf"]>>;
    receiptFilename: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    paymentReference?: string | undefined;
    receiptData?: string | undefined;
    receiptMimeType?: "image/jpeg" | "image/png" | "image/webp" | "application/pdf" | undefined;
    receiptFilename?: string | undefined;
}, {
    paymentReference?: string | undefined;
    receiptData?: string | undefined;
    receiptMimeType?: "image/jpeg" | "image/png" | "image/webp" | "application/pdf" | undefined;
    receiptFilename?: string | undefined;
}>, {
    paymentReference?: string | undefined;
    receiptData?: string | undefined;
    receiptMimeType?: "image/jpeg" | "image/png" | "image/webp" | "application/pdf" | undefined;
    receiptFilename?: string | undefined;
}, {
    paymentReference?: string | undefined;
    receiptData?: string | undefined;
    receiptMimeType?: "image/jpeg" | "image/png" | "image/webp" | "application/pdf" | undefined;
    receiptFilename?: string | undefined;
}>, {
    paymentReference?: string | undefined;
    receiptData?: string | undefined;
    receiptMimeType?: "image/jpeg" | "image/png" | "image/webp" | "application/pdf" | undefined;
    receiptFilename?: string | undefined;
}, {
    paymentReference?: string | undefined;
    receiptData?: string | undefined;
    receiptMimeType?: "image/jpeg" | "image/png" | "image/webp" | "application/pdf" | undefined;
    receiptFilename?: string | undefined;
}>;
export declare const TradeItem: z.ZodObject<{
    id: z.ZodString;
    symbol: z.ZodString;
    side: z.ZodEnum<["buy", "sell"]>;
    size: z.ZodNumber;
    entryPrice: z.ZodNumber;
    exitPrice: z.ZodNumber;
    pnl: z.ZodNumber;
    openedAt: z.ZodNumber;
    closedAt: z.ZodNumber;
    reason: z.ZodString;
    leverage: z.ZodOptional<z.ZodNumber>;
    stopLoss: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    takeProfit: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    note: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    id: string;
    side: "buy" | "sell";
    size: number;
    entryPrice: number;
    exitPrice: number;
    pnl: number;
    openedAt: number;
    closedAt: number;
    reason: string;
    leverage?: number | undefined;
    stopLoss?: number | null | undefined;
    takeProfit?: number | null | undefined;
    note?: string | null | undefined;
}, {
    symbol: string;
    id: string;
    side: "buy" | "sell";
    size: number;
    entryPrice: number;
    exitPrice: number;
    pnl: number;
    openedAt: number;
    closedAt: number;
    reason: string;
    leverage?: number | undefined;
    stopLoss?: number | null | undefined;
    takeProfit?: number | null | undefined;
    note?: string | null | undefined;
}>;
export declare const TradesBody: z.ZodUnion<[z.ZodObject<{
    id: z.ZodString;
    symbol: z.ZodString;
    side: z.ZodEnum<["buy", "sell"]>;
    size: z.ZodNumber;
    entryPrice: z.ZodNumber;
    exitPrice: z.ZodNumber;
    pnl: z.ZodNumber;
    openedAt: z.ZodNumber;
    closedAt: z.ZodNumber;
    reason: z.ZodString;
    leverage: z.ZodOptional<z.ZodNumber>;
    stopLoss: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    takeProfit: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    note: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    id: string;
    side: "buy" | "sell";
    size: number;
    entryPrice: number;
    exitPrice: number;
    pnl: number;
    openedAt: number;
    closedAt: number;
    reason: string;
    leverage?: number | undefined;
    stopLoss?: number | null | undefined;
    takeProfit?: number | null | undefined;
    note?: string | null | undefined;
}, {
    symbol: string;
    id: string;
    side: "buy" | "sell";
    size: number;
    entryPrice: number;
    exitPrice: number;
    pnl: number;
    openedAt: number;
    closedAt: number;
    reason: string;
    leverage?: number | undefined;
    stopLoss?: number | null | undefined;
    takeProfit?: number | null | undefined;
    note?: string | null | undefined;
}>, z.ZodArray<z.ZodObject<{
    id: z.ZodString;
    symbol: z.ZodString;
    side: z.ZodEnum<["buy", "sell"]>;
    size: z.ZodNumber;
    entryPrice: z.ZodNumber;
    exitPrice: z.ZodNumber;
    pnl: z.ZodNumber;
    openedAt: z.ZodNumber;
    closedAt: z.ZodNumber;
    reason: z.ZodString;
    leverage: z.ZodOptional<z.ZodNumber>;
    stopLoss: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    takeProfit: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    note: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    id: string;
    side: "buy" | "sell";
    size: number;
    entryPrice: number;
    exitPrice: number;
    pnl: number;
    openedAt: number;
    closedAt: number;
    reason: string;
    leverage?: number | undefined;
    stopLoss?: number | null | undefined;
    takeProfit?: number | null | undefined;
    note?: string | null | undefined;
}, {
    symbol: string;
    id: string;
    side: "buy" | "sell";
    size: number;
    entryPrice: number;
    exitPrice: number;
    pnl: number;
    openedAt: number;
    closedAt: number;
    reason: string;
    leverage?: number | undefined;
    stopLoss?: number | null | undefined;
    takeProfit?: number | null | undefined;
    note?: string | null | undefined;
}>, "many">]>;
export declare const ProgressBody: z.ZodObject<{
    xp: z.ZodOptional<z.ZodNumber>;
    streakDays: z.ZodOptional<z.ZodNumber>;
    lastActivityDay: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    perfectQuizCount: z.ZodOptional<z.ZodNumber>;
    missionDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    completedLessons: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    quizScores: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
    achievements: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    reviewQueue: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    dailyMissions: z.ZodOptional<z.ZodArray<z.ZodUnknown, "many">>;
    onboarded: z.ZodOptional<z.ZodBoolean>;
    userLevel: z.ZodOptional<z.ZodNullable<z.ZodEnum<["iniciante", "intermediario", "avancado"]>>>;
    userInterests: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    settings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    booksProgress: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    seenAchievements: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    watchedVideos: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    simCashBalance: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    xp?: number | undefined;
    streakDays?: number | undefined;
    lastActivityDay?: string | null | undefined;
    perfectQuizCount?: number | undefined;
    missionDate?: string | null | undefined;
    completedLessons?: string[] | undefined;
    quizScores?: Record<string, number> | undefined;
    achievements?: string[] | undefined;
    reviewQueue?: string[] | undefined;
    dailyMissions?: unknown[] | undefined;
    onboarded?: boolean | undefined;
    userLevel?: "iniciante" | "intermediario" | "avancado" | null | undefined;
    userInterests?: string[] | undefined;
    settings?: Record<string, unknown> | undefined;
    booksProgress?: Record<string, unknown> | undefined;
    seenAchievements?: string[] | undefined;
    watchedVideos?: string[] | undefined;
    simCashBalance?: number | undefined;
}, {
    xp?: number | undefined;
    streakDays?: number | undefined;
    lastActivityDay?: string | null | undefined;
    perfectQuizCount?: number | undefined;
    missionDate?: string | null | undefined;
    completedLessons?: string[] | undefined;
    quizScores?: Record<string, number> | undefined;
    achievements?: string[] | undefined;
    reviewQueue?: string[] | undefined;
    dailyMissions?: unknown[] | undefined;
    onboarded?: boolean | undefined;
    userLevel?: "iniciante" | "intermediario" | "avancado" | null | undefined;
    userInterests?: string[] | undefined;
    settings?: Record<string, unknown> | undefined;
    booksProgress?: Record<string, unknown> | undefined;
    seenAchievements?: string[] | undefined;
    watchedVideos?: string[] | undefined;
    simCashBalance?: number | undefined;
}>;
export declare const DueloCreateBody: z.ZodObject<{
    title: z.ZodString;
    targetEquity: z.ZodNumber;
    startBalance: z.ZodNumber;
    maxDrawdownPct: z.ZodNumber;
    maxTrades: z.ZodNumber;
    expiresAt: z.ZodNumber;
    code: z.ZodOptional<z.ZodString>;
    startEquity: z.ZodOptional<z.ZodNumber>;
    accepted: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    title: string;
    targetEquity: number;
    startBalance: number;
    maxDrawdownPct: number;
    maxTrades: number;
    expiresAt: number;
    code?: string | undefined;
    startEquity?: number | undefined;
    accepted?: boolean | undefined;
}, {
    title: string;
    targetEquity: number;
    startBalance: number;
    maxDrawdownPct: number;
    maxTrades: number;
    expiresAt: number;
    code?: string | undefined;
    startEquity?: number | undefined;
    accepted?: boolean | undefined;
}>;
export declare const DueloPatchBody: z.ZodObject<{
    accepted: z.ZodOptional<z.ZodBoolean>;
    startEquity: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    startEquity?: number | undefined;
    accepted?: boolean | undefined;
}, {
    startEquity?: number | undefined;
    accepted?: boolean | undefined;
}>;
//# sourceMappingURL=schemas.d.ts.map