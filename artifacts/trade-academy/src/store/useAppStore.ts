import { create } from "zustand";
import { persist } from "zustand/middleware";

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
  emoji: string;
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
    emoji: "🎯",
    targetEquity: 11_000,
    startBalance: 10_000,
    minTrades: 5,
    maxDrawdownPct: 20,
  },
  {
    id: "intermediate",
    title: "Trader consistente",
    description: "Alcance $13.000 a partir de $10.000 com no máximo 15% de drawdown.",
    emoji: "📈",
    targetEquity: 13_000,
    startBalance: 10_000,
    minTrades: 10,
    maxDrawdownPct: 15,
  },
  {
    id: "advanced",
    title: "Mestre do risco",
    description: "Chegue a $20.000 a partir de $10.000 com máximo de 10% de drawdown.",
    emoji: "🏆",
    targetEquity: 20_000,
    startBalance: 10_000,
    minTrades: 20,
    maxDrawdownPct: 10,
  },
];

/* ============== Estado ============== */

export interface ProgressState {
  xp: number;
  completedLessons: string[];
  quizScores: Record<string, number>;
  streakDays: number;
  lastActivityDay: string | null;
  achievements: string[];
}

export interface SimState {
  cashBalance: number;
  positions: Position[];
  pendingOrders: PendingOrder[];
  history: ClosedTrade[];
  equityHistory: EquityPoint[];
  challenges: Challenge[];
}

interface AppState {
  progress: ProgressState;
  sim: SimState;

  // progress actions
  completeLesson: (lessonId: string, xp: number, scorePct: number) => void;
  resetProgress: () => void;

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
}

const today = () => new Date().toISOString().slice(0, 10);

const initialProgress: ProgressState = {
  xp: 0,
  completedLessons: [],
  quizScores: {},
  streakDays: 0,
  lastActivityDay: null,
  achievements: [],
};

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

/* ============== Store ============== */

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      progress: initialProgress,
      sim: initialSim,

      /* -------- Progress -------- */
      completeLesson: (lessonId, xp, scorePct) =>
        set((s) => {
          const already = s.progress.completedLessons.includes(lessonId);
          const t = today();
          const last = s.progress.lastActivityDay;
          let streak = s.progress.streakDays;
          if (last !== t) {
            if (last) {
              const d1 = new Date(last);
              const d2 = new Date(t);
              const diff = Math.round((d2.getTime() - d1.getTime()) / 86_400_000);
              streak = diff === 1 ? streak + 1 : 1;
            } else {
              streak = 1;
            }
          }
          const newAch = new Set(s.progress.achievements);
          if (!already) {
            if (s.progress.completedLessons.length + 1 >= 1) newAch.add("first-lesson");
            if (s.progress.completedLessons.length + 1 >= 5) newAch.add("five-lessons");
            if (s.progress.xp + xp >= 200) newAch.add("xp-200");
          }
          if (streak >= 3) newAch.add("streak-3");
          return {
            progress: {
              ...s.progress,
              xp: s.progress.xp + (already ? Math.round(xp * 0.25) : xp),
              completedLessons: already ? s.progress.completedLessons : [...s.progress.completedLessons, lessonId],
              quizScores: { ...s.progress.quizScores, [lessonId]: scorePct },
              streakDays: streak,
              lastActivityDay: t,
              achievements: Array.from(newAch),
            },
          };
        }),

      resetProgress: () => set({ progress: initialProgress }),

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

          // Check challenge progress
          const newHistory = [closed, ...s.sim.history].slice(0, 500);
          const updatedChallenges = s.sim.challenges.map((ch) => {
            if (!ch.active || ch.completed || ch.failed) return ch;
            const totalTradesDone = newHistory.length;
            const peakEquity = Math.max(ch.peakEquity, newCash);
            const drawdownPct = peakEquity > 0 ? ((peakEquity - newCash) / peakEquity) * 100 : 0;
            const failed = drawdownPct > ch.maxDrawdownPct;
            const completed = !failed && newCash >= ch.targetEquity && totalTradesDone >= ch.minTrades;
            return { ...ch, peakEquity, completed, failed };
          });

          return {
            sim: {
              ...s.sim,
              cashBalance: newCash,
              positions: newPositions,
              history: newHistory,
              challenges: updatedChallenges,
              equityHistory: [...s.sim.equityHistory, { time: Date.now(), equity: newCash }].slice(-500),
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
    }),
    { name: "tradeacademy-store-v2" },
  ),
);
