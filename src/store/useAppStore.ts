import { create } from "zustand";
import { persist } from "zustand/middleware";

/* ============== Tipos ============== */

export type Side = "buy" | "sell";

export interface Position {
  id: string;
  symbol: string;
  side: Side;
  size: number;        // unidades do ativo
  entryPrice: number;
  openedAt: number;
  stopLoss?: number;
  takeProfit?: number;
}

export interface ClosedTrade extends Position {
  closedAt: number;
  exitPrice: number;
  pnl: number;
  reason: "manual" | "stop" | "target";
}

export interface ProgressState {
  xp: number;
  completedLessons: string[];
  quizScores: Record<string, number>; // lessonId -> 0..100
  streakDays: number;
  lastActivityDay: string | null;     // YYYY-MM-DD
  achievements: string[];
}

export interface SimState {
  cashBalance: number;          // saldo livre USD
  positions: Position[];
  history: ClosedTrade[];
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

const initialSim: SimState = {
  cashBalance: 10_000,
  positions: [],
  history: [],
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      progress: initialProgress,
      sim: initialSim,

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
              completedLessons: already
                ? s.progress.completedLessons
                : [...s.progress.completedLessons, lessonId],
              quizScores: { ...s.progress.quizScores, [lessonId]: scorePct },
              streakDays: streak,
              lastActivityDay: t,
              achievements: Array.from(newAch),
            },
          };
        }),

      resetProgress: () => set({ progress: initialProgress }),

      openPosition: (p) => {
        const cost = p.size * p.entryPrice;
        const { cashBalance } = get().sim;
        if (cost > cashBalance) return null;
        const id = `pos_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        set((s) => ({
          sim: {
            ...s.sim,
            cashBalance: s.sim.cashBalance - cost,
            positions: [
              ...s.sim.positions,
              { ...p, id, openedAt: Date.now() },
            ],
          },
        }));
        return id;
      },

      closePosition: (id, exitPrice, reason = "manual") =>
        set((s) => {
          const pos = s.sim.positions.find((p) => p.id === id);
          if (!pos) return s;
          const direction = pos.side === "buy" ? 1 : -1;
          const pnl = (exitPrice - pos.entryPrice) * pos.size * direction;
          // devolvemos o custo original + pnl
          const refund = pos.entryPrice * pos.size + pnl;
          const closed: ClosedTrade = {
            ...pos,
            closedAt: Date.now(),
            exitPrice,
            pnl,
            reason,
          };
          return {
            sim: {
              cashBalance: s.sim.cashBalance + refund,
              positions: s.sim.positions.filter((p) => p.id !== id),
              history: [closed, ...s.sim.history].slice(0, 200),
            },
          };
        }),

      evaluateStops: (symbol, lastPrice) => {
        const positions = get().sim.positions.filter((p) => p.symbol === symbol);
        for (const p of positions) {
          if (p.side === "buy") {
            if (p.stopLoss && lastPrice <= p.stopLoss) get().closePosition(p.id, lastPrice, "stop");
            else if (p.takeProfit && lastPrice >= p.takeProfit) get().closePosition(p.id, lastPrice, "target");
          } else {
            if (p.stopLoss && lastPrice >= p.stopLoss) get().closePosition(p.id, lastPrice, "stop");
            else if (p.takeProfit && lastPrice <= p.takeProfit) get().closePosition(p.id, lastPrice, "target");
          }
        }
      },

      resetSim: () => set({ sim: initialSim }),
    }),
    {
      name: "tradeacademy-store-v1",
    },
  ),
);

/* ============== Helpers ============== */

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

export function equity(state: AppState, priceMap: Record<string, number>) {
  const used = state.sim.positions.reduce((sum, p) => sum + p.entryPrice * p.size, 0);
  const upnl = calcUnrealizedPnL(state.sim.positions, priceMap);
  return state.sim.cashBalance + used + upnl;
}
