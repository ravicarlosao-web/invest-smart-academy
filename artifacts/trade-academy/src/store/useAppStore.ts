import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ACHIEVEMENT_MAP, getDailyMissions, MISSION_POOL, MissionType } from "@/data/gamification";
import { LEVELS } from "@/data/curriculum";
import type { AppNotification } from "@/data/notifications";

/* ============== Tipos base ============== */

export type Side = "buy" | "sell";
export type OrderType = "market" | "limit" | "stop";

export interface Position {
  id: string;
  symbol: string;
  side: Side;
  size: number;
  entryPrice: number;
  openedAt: number;
  stopLoss?: number;
  takeProfit?: number;
  leverage?: number;
  liquidationPrice?: number;
  note?: string;
}

export interface ClosedTrade extends Position {
  closedAt: number;
  exitPrice: number;
  pnl: number;
  reason: "manual" | "stop" | "target" | "liquidation";
}

export interface PendingOrder {
  id: string;
  symbol: string;
  side: Side;
  orderType: "limit" | "stop";
  size: number;
  triggerPrice: number;
  leverage: number;
  stopLoss?: number;
  takeProfit?: number;
  note?: string;
  createdAt: number;
}

export interface EquityPoint {
  time: number;   // Unix ms
  equity: number;
}

/* ============== Desafios ============== */

export interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  targetEquity: number;
  startBalance: number;
  minTrades: number;
  maxDrawdownPct: number;
  active: boolean;
  completed: boolean;
  failed: boolean;
  startedAt: number | null;
  peakEquity: number;
}

export const CHALLENGES: Omit<Challenge, "active" | "completed" | "failed" | "startedAt" | "peakEquity">[] = [
  {
    id: "beginner",
    title: "Primeira vitória",
    description: "Transforme $10.000 em $11.000 fazendo pelo menos 5 trades.",
    icon: "Target",
    targetEquity: 11_000,
    startBalance: 10_000,
    minTrades: 5,
    maxDrawdownPct: 20,
  },
  {
    id: "intermediate",
    title: "Trader consistente",
    description: "Alcance $13.000 a partir de $10.000 com no máximo 15% de drawdown.",
    icon: "TrendingUp",
    targetEquity: 13_000,
    startBalance: 10_000,
    minTrades: 10,
    maxDrawdownPct: 15,
  },
  {
    id: "advanced",
    title: "Mestre do risco",
    description: "Chegue a $20.000 a partir de $10.000 com máximo de 10% de drawdown.",
    icon: "Trophy",
    targetEquity: 20_000,
    startBalance: 10_000,
    minTrades: 20,
    maxDrawdownPct: 10,
  },
];

/* ============== Estado ============== */

export interface Settings {
  notifyGoals: boolean;
  dailyTip: boolean;
  weeklyReport: boolean;
  confirmOrders: boolean;
  realtimePnl: boolean;
  autoSaveNotes: boolean;
}

export interface DailyMissionState {
  id: string;
  progress: number;
  completed: boolean;
}

export interface ProgressState {
  xp: number;
  completedLessons: string[];
  quizScores: Record<string, number>;
  streakDays: number;
  lastActivityDay: string | null;
  achievements: string[];
  reviewQueue: string[];
  perfectQuizCount: number;
  dailyMissions: DailyMissionState[];
  missionDate: string | null;
}

export interface SimState {
  cashBalance: number;
  positions: Position[];
  pendingOrders: PendingOrder[];
  history: ClosedTrade[];
  equityHistory: EquityPoint[];
  challenges: Challenge[];
}

/* ============== Livros ============== */
export interface BookProgress {
  completed:    boolean;
  completedAt?: string;
  scrollPercent: number;
}

/* ============== Duelo ============== */
export interface DueloEntry {
  id: string;
  title: string;
  targetEquity: number;
  startBalance: number;
  maxDrawdownPct: number;
  maxTrades: number;
  expiresAt: number;
  createdAt: number;
  startEquity: number;
  accepted: boolean;
  code: string;
}

interface AppState {
  progress: ProgressState;
  sim: SimState;
  onboarded: boolean;
  userLevel: "iniciante" | "intermediario" | "avancado" | null;
  userInterests: string[];
  settings: Settings;
  notifications: AppNotification[];
  seenAchievements: string[];
  duelos: DueloEntry[];
  booksProgress: Record<string, BookProgress>;

  // full reset (called on logout to clear active user state)
  resetAll: () => void;

  // onboarding / settings
  completeOnboarding: (level: string, interests: string[]) => void;
  updateSettings: (partial: Partial<Settings>) => void;

  // progress actions
  completeLesson: (lessonId: string, xp: number, scorePct: number) => void;
  resetProgress: () => void;
  addToReview: (lessonId: string) => void;
  removeFromReview: (lessonId: string) => void;
  tickMission: (type: MissionType, increment?: number) => void;
  refreshDailyMissions: () => void;

  // sim actions
  openPosition: (p: Omit<Position, "id" | "openedAt">) => string | null;
  closePosition: (id: string, exitPrice: number, reason?: ClosedTrade["reason"]) => void;
  evaluateStops: (symbol: string, lastPrice: number) => void;
  placePendingOrder: (o: Omit<PendingOrder, "id" | "createdAt">) => string;
  cancelPendingOrder: (id: string) => void;
  evaluatePendingOrders: (symbol: string, lastPrice: number) => void;
  recordEquity: (priceMap: Record<string, number>) => void;
  startChallenge: (id: string) => void;
  resetSim: () => void;

  // notification actions
  addNotification: (n: Omit<AppNotification, "id" | "read" | "createdAt">) => void;
  markAllRead: () => void;
  dismissNotification: (id: string) => void;
  markAchievementsSeen: (ids: string[]) => void;

  // duelo actions
  createDuelo: (d: Omit<DueloEntry, "id" | "createdAt" | "accepted" | "code" | "startEquity">) => string;
  acceptDuelo: (code: string, currentEquity: number) => boolean;
  removeDuelo: (id: string) => void;

  // books actions
  updateBookProgress: (bookId: string, scrollPercent: number) => void;
  markBookComplete:   (bookId: string) => void;
}

const initialSettings: Settings = {
  notifyGoals: true,
  dailyTip: true,
  weeklyReport: false,
  confirmOrders: false,
  realtimePnl: true,
  autoSaveNotes: true,
};

const today = () => new Date().toISOString().slice(0, 10);

const initialProgress: ProgressState = {
  xp: 0,
  completedLessons: [],
  quizScores: {},
  streakDays: 0,
  lastActivityDay: null,
  achievements: [],
  reviewQueue: [],
  perfectQuizCount: 0,
  dailyMissions: [],
  missionDate: null,
};

/* Helper: build DailyMissionState[] for a date */
function buildMissionsForDate(dateStr: string): DailyMissionState[] {
  return getDailyMissions(dateStr).map((m) => ({ id: m.id, progress: 0, completed: false }));
}

/* Helper: compute which achievements should be unlocked */
function computeAchievements(
  prev: string[],
  p: ProgressState,
  history: ClosedTrade[],
): string[] {
  const earned = new Set(prev);
  const wins = history.filter((t) => t.pnl > 0);
  const totalPnl = history.reduce((s, t) => s + t.pnl, 0);
  const winRate = history.length >= 10 ? wins.length / history.length : 0;
  const level1 = LEVELS[0];
  const level1Done = level1.lessons.every((l) => p.completedLessons.includes(l.id));

  const checks: [string, boolean][] = [
    ["first-lesson",   p.completedLessons.length >= 1],
    ["five-lessons",   p.completedLessons.length >= 5],
    ["ten-lessons",    p.completedLessons.length >= 10],
    ["twenty-lessons", p.completedLessons.length >= 20],
    ["all-lessons",    p.completedLessons.length >= 40],
    ["perfect-quiz",   p.perfectQuizCount >= 1],
    ["three-perfects", p.perfectQuizCount >= 3],
    ["level-1-done",   level1Done],
    ["streak-3",       p.streakDays >= 3],
    ["streak-7",       p.streakDays >= 7],
    ["streak-14",      p.streakDays >= 14],
    ["streak-30",      p.streakDays >= 30],
    ["first-trade",    history.length >= 1],
    ["first-profit",   wins.length >= 1],
    ["profit-100",     totalPnl >= 100],
    ["profit-500",     totalPnl >= 500],
    ["trades-10",      history.length >= 10],
    ["trades-50",      history.length >= 50],
    ["trades-100",     history.length >= 100],
    ["win-rate-60",    winRate >= 0.6],
    ["xp-100",         p.xp >= 100],
    ["xp-500",         p.xp >= 500],
    ["xp-1000",        p.xp >= 1000],
    ["xp-2500",        p.xp >= 2500],
    ["challenge-done", false], // handled separately on challenge complete
  ];

  for (const [id, cond] of checks) {
    if (cond && ACHIEVEMENT_MAP[id]) earned.add(id);
  }

  return Array.from(earned);
}

function buildInitialChallenges(): Challenge[] {
  return CHALLENGES.map((c) => ({
    ...c,
    active: false,
    completed: false,
    failed: false,
    startedAt: null,
    peakEquity: c.startBalance,
  }));
}

const initialSim: SimState = {
  cashBalance: 10_000,
  positions: [],
  pendingOrders: [],
  history: [],
  equityHistory: [{ time: Date.now(), equity: 10_000 }],
  challenges: buildInitialChallenges(),
};

/* ============== Helpers ============== */

export function positionMargin(p: Position): number {
  return (p.entryPrice * p.size) / (p.leverage ?? 1);
}

export function positionNotional(p: Position): number {
  return p.entryPrice * p.size;
}

export function calcUnrealizedPnL(positions: Position[], priceMap: Record<string, number>) {
  let total = 0;
  for (const p of positions) {
    const last = priceMap[p.symbol];
    if (last == null) continue;
    const dir = p.side === "buy" ? 1 : -1;
    total += (last - p.entryPrice) * p.size * dir;
  }
  return total;
}

export function calcEquity(sim: SimState, priceMap: Record<string, number>): number {
  const usedMargin = sim.positions.reduce((s, p) => s + positionMargin(p), 0);
  const upnl = calcUnrealizedPnL(sim.positions, priceMap);
  return sim.cashBalance + usedMargin + upnl;
}

/* ============== Performance metrics ============== */

export function calcProfitFactor(history: ClosedTrade[]): number {
  const gains = history.filter((t) => t.pnl > 0).reduce((s, t) => s + t.pnl, 0);
  const losses = Math.abs(history.filter((t) => t.pnl <= 0).reduce((s, t) => s + t.pnl, 0));
  if (losses === 0) return gains > 0 ? Infinity : 1;
  return gains / losses;
}

export function calcMaxDrawdown(equityHistory: EquityPoint[]): number {
  let peak = -Infinity;
  let maxDD = 0;
  for (const { equity } of equityHistory) {
    if (equity > peak) peak = equity;
    const dd = peak > 0 ? (peak - equity) / peak : 0;
    if (dd > maxDD) maxDD = dd;
  }
  return maxDD;
}

export function calcSharpe(equityHistory: EquityPoint[]): number {
  if (equityHistory.length < 3) return 0;
  const returns: number[] = [];
  for (let i = 1; i < equityHistory.length; i++) {
    const prev = equityHistory[i - 1].equity;
    if (prev > 0) returns.push((equityHistory[i].equity - prev) / prev);
  }
  if (returns.length < 2) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / (returns.length - 1);
  const stdDev = Math.sqrt(variance);
  if (stdDev === 0) return 0;
  return (mean / stdDev) * Math.sqrt(252);
}

/* Helper: tick missions of a given type */
function tickMissions(
  missions: DailyMissionState[],
  type: MissionType,
  increment: number,
): DailyMissionState[] {
  if (increment === 0) return missions;
  return missions.map((m) => {
    if (m.completed) return m;
    const def = MISSION_POOL.find((p) => p.id === m.id);
    if (!def || def.type !== type) return m;
    const newProgress = m.progress + increment;
    return { ...m, progress: newProgress, completed: newProgress >= def.target };
  });
}

/* ============== Store ============== */

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      progress: initialProgress,
      sim: initialSim,
      onboarded: false,
      userLevel: null,
      userInterests: [],
      settings: initialSettings,
      notifications: [],
      seenAchievements: [],
      duelos: [],
      booksProgress: {},

      /* -------- Full reset (called on logout) -------- */
      resetAll: () =>
        set({
          progress:       initialProgress,
          sim: {
            ...initialSim,
            challenges:    buildInitialChallenges(),
            equityHistory: [{ time: Date.now(), equity: 10_000 }],
          },
          onboarded:       false,
          userLevel:       null,
          userInterests:   [],
          settings:        initialSettings,
          notifications:   [],
          seenAchievements:[],
          duelos:          [],
          booksProgress:   {},
        }),

      /* -------- Onboarding / Settings -------- */
      completeOnboarding: (level, interests) =>
        set({ onboarded: true, userLevel: level as AppState["userLevel"], userInterests: interests }),

      updateSettings: (partial) =>
        set((s) => ({ settings: { ...s.settings, ...partial } })),

      /* -------- Progress -------- */
      completeLesson: (lessonId, xpEarned, scorePct) =>
        set((s) => {
          const already = s.progress.completedLessons.includes(lessonId);
          const t = today();
          const last = s.progress.lastActivityDay;
          let streak = s.progress.streakDays;
          if (last !== t) {
            if (last) {
              const diff = Math.round((new Date(t).getTime() - new Date(last).getTime()) / 86_400_000);
              streak = diff === 1 ? streak + 1 : 1;
            } else {
              streak = 1;
            }
          }

          const isPerfect = scorePct === 100;
          const newPerfectCount = s.progress.perfectQuizCount + (isPerfect && !already ? 1 : 0);
          const newXp = s.progress.xp + (already ? Math.round(xpEarned * 0.25) : xpEarned);
          const newCompleted = already
            ? s.progress.completedLessons
            : [...s.progress.completedLessons, lessonId];

          // Review queue: add if score < 80%; remove if re-completed with 80%+
          let reviewQueue = [...(s.progress.reviewQueue ?? [])];
          if (!already && scorePct < 80) {
            if (!reviewQueue.includes(lessonId)) reviewQueue.push(lessonId);
          } else if (scorePct >= 80) {
            reviewQueue = reviewQueue.filter((id) => id !== lessonId);
          }

          // Build provisional state for achievement computation
          const provisional: ProgressState = {
            ...s.progress,
            xp: newXp,
            completedLessons: newCompleted,
            streakDays: streak,
            perfectQuizCount: newPerfectCount,
            reviewQueue,
          };
          const newAchievements = computeAchievements(s.progress.achievements, provisional, s.sim.history);

          // Tick daily missions
          const t2 = today();
          let missions = (s.progress.missionDate === t2 ? s.progress.dailyMissions : buildMissionsForDate(t2));
          const mDate = t2;
          missions = tickMissions(missions, "lessons", already ? 0 : 1);
          if (isPerfect && !already) missions = tickMissions(missions, "perfect_quiz", 1);

          return {
            progress: {
              ...s.progress,
              xp: newXp,
              completedLessons: newCompleted,
              quizScores: { ...s.progress.quizScores, [lessonId]: scorePct },
              streakDays: streak,
              lastActivityDay: t,
              achievements: newAchievements,
              perfectQuizCount: newPerfectCount,
              reviewQueue,
              dailyMissions: missions,
              missionDate: mDate,
            },
          };
        }),

      resetProgress: () => set({ progress: initialProgress }),

      addToReview: (lessonId) =>
        set((s) => {
          const q = s.progress.reviewQueue ?? [];
          if (q.includes(lessonId)) return s;
          return { progress: { ...s.progress, reviewQueue: [...q, lessonId] } };
        }),

      removeFromReview: (lessonId) =>
        set((s) => ({
          progress: {
            ...s.progress,
            reviewQueue: (s.progress.reviewQueue ?? []).filter((id) => id !== lessonId),
          },
        })),

      tickMission: (type, increment = 1) =>
        set((s) => {
          const t = today();
          const missions = s.progress.missionDate === t
            ? s.progress.dailyMissions
            : buildMissionsForDate(t);
          return {
            progress: {
              ...s.progress,
              dailyMissions: tickMissions(missions, type, increment),
              missionDate: t,
            },
          };
        }),

      refreshDailyMissions: () =>
        set((s) => {
          const t = today();
          if (s.progress.missionDate === t) return s;
          return {
            progress: {
              ...s.progress,
              dailyMissions: buildMissionsForDate(t),
              missionDate: t,
            },
          };
        }),

      /* -------- Positions -------- */
      openPosition: (p) => {
        const leverage = Math.max(1, p.leverage ?? 1);
        const notional = p.size * p.entryPrice;
        const margin = notional / leverage;
        const { cashBalance } = get().sim;
        if (margin > cashBalance) return null;
        const liquidationPrice =
          leverage > 1
            ? p.side === "buy"
              ? p.entryPrice * (1 - 1 / leverage)
              : p.entryPrice * (1 + 1 / leverage)
            : undefined;
        const id = `pos_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        set((s) => {
          const newPositions = [...s.sim.positions, { ...p, id, openedAt: Date.now(), leverage, liquidationPrice }];
          const equity = s.sim.cashBalance - margin + newPositions.reduce((sum, pos) => sum + positionMargin(pos), 0);
          return {
            sim: {
              ...s.sim,
              cashBalance: s.sim.cashBalance - margin,
              positions: newPositions,
              equityHistory: [...s.sim.equityHistory, { time: Date.now(), equity: s.sim.cashBalance - margin + margin }].slice(-500),
            },
          };
        });
        return id;
      },

      closePosition: (id, exitPrice, reason = "manual") =>
        set((s) => {
          const pos = s.sim.positions.find((p) => p.id === id);
          if (!pos) return s;
          const leverage = pos.leverage ?? 1;
          const direction = pos.side === "buy" ? 1 : -1;
          const rawPnl = (exitPrice - pos.entryPrice) * pos.size * direction;
          const margin = (pos.entryPrice * pos.size) / leverage;
          const pnl = reason === "liquidation" ? -margin : rawPnl;
          const refund = margin + pnl;
          const closed: ClosedTrade = { ...pos, closedAt: Date.now(), exitPrice, pnl, reason };
          const newCash = s.sim.cashBalance + refund;
          const newPositions = s.sim.positions.filter((p) => p.id !== id);
          const newHistory = [closed, ...s.sim.history].slice(0, 500);

          // Check challenge progress + challenge-done achievement
          let challengeDone = false;
          const updatedChallenges = s.sim.challenges.map((ch) => {
            if (!ch.active || ch.completed || ch.failed) return ch;
            const peakEquity = Math.max(ch.peakEquity, newCash);
            const drawdownPct = peakEquity > 0 ? ((peakEquity - newCash) / peakEquity) * 100 : 0;
            const failed = drawdownPct > ch.maxDrawdownPct;
            const completed = !failed && newCash >= ch.targetEquity && newHistory.length >= ch.minTrades;
            if (completed) challengeDone = true;
            return { ...ch, peakEquity, completed, failed };
          });

          // Update achievements with sim data
          const provisionalProgress: ProgressState = {
            ...s.progress,
            achievements: challengeDone
              ? [...new Set([...s.progress.achievements, "challenge-done"])]
              : s.progress.achievements,
          };
          const newAchievements = computeAchievements(
            provisionalProgress.achievements,
            provisionalProgress,
            newHistory,
          );

          // Tick daily trade missions
          const t = today();
          let missions = s.progress.missionDate === t
            ? [...s.progress.dailyMissions]
            : buildMissionsForDate(t);
          missions = tickMissions(missions, "trades", 1);
          if (pnl > 0) missions = tickMissions(missions, "profitable_trades", 1);

          return {
            sim: {
              ...s.sim,
              cashBalance: newCash,
              positions: newPositions,
              history: newHistory,
              challenges: updatedChallenges,
              equityHistory: [...s.sim.equityHistory, { time: Date.now(), equity: newCash }].slice(-500),
            },
            progress: {
              ...s.progress,
              achievements: newAchievements,
              dailyMissions: missions,
              missionDate: t,
            },
          };
        }),

      evaluateStops: (symbol, lastPrice) => {
        const positions = get().sim.positions.filter((p) => p.symbol === symbol);
        for (const p of positions) {
          if (p.liquidationPrice != null) {
            if (p.side === "buy" && lastPrice <= p.liquidationPrice) {
              get().closePosition(p.id, p.liquidationPrice, "liquidation");
              continue;
            }
            if (p.side === "sell" && lastPrice >= p.liquidationPrice) {
              get().closePosition(p.id, p.liquidationPrice, "liquidation");
              continue;
            }
          }
          if (p.side === "buy") {
            if (p.stopLoss && lastPrice <= p.stopLoss) get().closePosition(p.id, lastPrice, "stop");
            else if (p.takeProfit && lastPrice >= p.takeProfit) get().closePosition(p.id, lastPrice, "target");
          } else {
            if (p.stopLoss && lastPrice >= p.stopLoss) get().closePosition(p.id, lastPrice, "stop");
            else if (p.takeProfit && lastPrice <= p.takeProfit) get().closePosition(p.id, lastPrice, "target");
          }
        }
      },

      /* -------- Pending Orders -------- */
      placePendingOrder: (o) => {
        const id = `pend_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        set((s) => ({
          sim: {
            ...s.sim,
            pendingOrders: [...s.sim.pendingOrders, { ...o, id, createdAt: Date.now() }],
          },
        }));
        return id;
      },

      cancelPendingOrder: (id) =>
        set((s) => ({
          sim: {
            ...s.sim,
            pendingOrders: s.sim.pendingOrders.filter((o) => o.id !== id),
          },
        })),

      evaluatePendingOrders: (symbol, lastPrice) => {
        const pending = get().sim.pendingOrders.filter((o) => o.symbol === symbol);
        for (const o of pending) {
          let triggered = false;
          if (o.orderType === "limit") {
            // Limit buy: execute when price <= triggerPrice
            // Limit sell: execute when price >= triggerPrice
            triggered = o.side === "buy" ? lastPrice <= o.triggerPrice : lastPrice >= o.triggerPrice;
          } else if (o.orderType === "stop") {
            // Stop buy: execute when price >= triggerPrice
            // Stop sell: execute when price <= triggerPrice
            triggered = o.side === "buy" ? lastPrice >= o.triggerPrice : lastPrice <= o.triggerPrice;
          }
          if (triggered) {
            // Remove pending order
            set((s) => ({
              sim: { ...s.sim, pendingOrders: s.sim.pendingOrders.filter((x) => x.id !== o.id) },
            }));
            // Open position at trigger price
            const posId = get().openPosition({
              symbol: o.symbol,
              side: o.side,
              size: o.size,
              entryPrice: o.triggerPrice,
              leverage: o.leverage,
              stopLoss: o.stopLoss,
              takeProfit: o.takeProfit,
              note: o.note,
            });
            if (!posId) {
              // Margem insuficiente — remove silently
            }
          }
        }
      },

      /* -------- Equity Curve -------- */
      recordEquity: (priceMap) =>
        set((s) => {
          const equity = calcEquity(s.sim, priceMap);
          const last = s.sim.equityHistory[s.sim.equityHistory.length - 1];
          // Record only if equity changed meaningfully (>0.01%) or every 30s
          const now = Date.now();
          const shouldRecord =
            !last ||
            Math.abs(equity - last.equity) / (last.equity || 1) > 0.0001 ||
            now - last.time > 30_000;
          if (!shouldRecord) return s;
          return {
            sim: {
              ...s.sim,
              equityHistory: [...s.sim.equityHistory, { time: now, equity }].slice(-500),
            },
          };
        }),

      /* -------- Challenges -------- */
      startChallenge: (id) =>
        set((s) => {
          const def = CHALLENGES.find((c) => c.id === id);
          if (!def) return s;
          return {
            sim: {
              ...s.sim,
              cashBalance: def.startBalance,
              positions: [],
              pendingOrders: [],
              history: [],
              equityHistory: [{ time: Date.now(), equity: def.startBalance }],
              challenges: s.sim.challenges.map((ch) => ({
                ...ch,
                active: ch.id === id,
                completed: ch.id === id ? false : ch.completed,
                failed: ch.id === id ? false : ch.failed,
                startedAt: ch.id === id ? Date.now() : ch.startedAt,
                peakEquity: ch.id === id ? def.startBalance : ch.peakEquity,
              })),
            },
          };
        }),

      resetSim: () =>
        set({
          sim: {
            ...initialSim,
            challenges: buildInitialChallenges(),
            equityHistory: [{ time: Date.now(), equity: 10_000 }],
          },
        }),

      /* -------- Notifications -------- */
      addNotification: (n) =>
        set((s) => {
          const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
          const notif: AppNotification = { ...n, id, read: false, createdAt: Date.now() };
          return { notifications: [notif, ...s.notifications].slice(0, 50) };
        }),

      markAllRead: () =>
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),

      dismissNotification: (id) =>
        set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),

      markAchievementsSeen: (ids) =>
        set((s) => ({ seenAchievements: [...new Set([...s.seenAchievements, ...ids])] })),

      /* -------- Duelos -------- */
      createDuelo: (d) => {
        const id = `duelo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const code = btoa(JSON.stringify({ ...d, id })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
        const entry: DueloEntry = {
          ...d,
          id,
          code,
          createdAt: Date.now(),
          accepted: false,
          startEquity: 0,
        };
        set((s) => ({ duelos: [entry, ...s.duelos] }));
        return code;
      },

      acceptDuelo: (code, currentEquity) => {
        try {
          const normalized = code.replace(/-/g, "+").replace(/_/g, "/");
          const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
          const data = JSON.parse(atob(padded));
          const existing = get().duelos.find((d) => d.id === data.id || d.code === code);
          if (existing) {
            if (!existing.accepted) {
              set((s) => ({
                duelos: s.duelos.map((d) =>
                  d.id === existing.id ? { ...d, accepted: true, startEquity: currentEquity } : d
                ),
              }));
            }
            return true;
          }
          const entry: DueloEntry = {
            ...data,
            code,
            createdAt: Date.now(),
            accepted: true,
            startEquity: currentEquity,
          };
          set((s) => ({ duelos: [entry, ...s.duelos] }));
          return true;
        } catch {
          return false;
        }
      },

      removeDuelo: (id) =>
        set((s) => ({ duelos: s.duelos.filter((d) => d.id !== id) })),

      /* -------- Books -------- */
      updateBookProgress: (bookId, scrollPercent) =>
        set((s) => {
          const prev = s.booksProgress[bookId] ?? { completed: false, scrollPercent: 0 };
          if (prev.completed) return s;
          return {
            booksProgress: {
              ...s.booksProgress,
              [bookId]: { ...prev, scrollPercent: Math.max(prev.scrollPercent, scrollPercent) },
            },
          };
        }),

      markBookComplete: (bookId) =>
        set((s) => {
          const prev = s.booksProgress[bookId] ?? { completed: false, scrollPercent: 0 };
          if (prev.completed) return s;
          return {
            booksProgress: {
              ...s.booksProgress,
              [bookId]: { completed: true, scrollPercent: 100, completedAt: new Date().toISOString() },
            },
          };
        }),
    }),
    {
      name: "tradeacademy-store-v2",
      /**
       * Deep merge nested objects (progress, sim) so that fields added
       * after the user's state was first persisted always have their
       * initial-state defaults — never `undefined`.
       * Zustand's default merge is shallow at the top level, so nested
       * objects like `progress` would replace the initial state entirely,
       * leaving newly-added fields such as `reviewQueue` or `dailyMissions`
       * as `undefined` in old persisted states. This causes selectors like
       * `s.progress.reviewQueue ?? []` to return a new array reference on
       * every render, triggering an infinite re-render loop.
       */
      merge: (persisted: unknown, current: AppState): AppState => {
        const p = (persisted ?? {}) as Partial<AppState>;
        return {
          ...current,
          ...p,
          progress:      { ...current.progress,      ...(p.progress      ?? {}) },
          sim:           { ...current.sim,            ...(p.sim           ?? {}) },
          settings:      { ...current.settings,       ...(p.settings      ?? {}) },
          booksProgress: { ...current.booksProgress,  ...(p.booksProgress ?? {}) },
        };
      },
    },
  ),
);
