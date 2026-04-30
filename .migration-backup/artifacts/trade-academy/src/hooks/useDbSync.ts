/**
 * useDbSync
 * Synchronises the Zustand app store with the Turso database.
 *
 * On login  → load all tables (progress, trades, notifications, duelos) into the store.
 * On change → debounced upsert for progress; immediate inserts for new trades;
 *             targeted API calls for notification/duelo mutations.
 */
import { useEffect, useRef, useCallback } from "react";
import { useAppStore }                    from "@/store/useAppStore";
import type { DueloEntry }               from "@/store/useAppStore";
import type { AppNotification }          from "@/data/notifications";
import { api }                           from "@/lib/apiClient";

const PROGRESS_DEBOUNCE_MS = 4_000;

/* ── helpers ─────────────────────────────────────────────── */

function buildProgressPayload(s: ReturnType<typeof useAppStore.getState>) {
  return {
    ...s.progress,
    onboarded:        s.onboarded,
    userLevel:        s.userLevel,
    userInterests:    s.userInterests,
    settings:         s.settings,
    booksProgress:    s.booksProgress,
    seenAchievements: s.seenAchievements,
    simCashBalance:   s.sim.cashBalance,
  };
}

/* ── main hook ───────────────────────────────────────────── */

export function useDbSync(userId: string | null) {
  const store = useAppStore;

  /* Flag: true while we are loading data from DB (prevents re-syncing the same data). */
  const isLoading = useRef(false);

  /* Debounce timer for progress saves. */
  const progressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Snapshot refs — used to detect what changed since last sync. */
  const prevTradeCount  = useRef<number>(0);
  const prevNotifIds    = useRef<Set<string>>(new Set());
  const prevNotifRead   = useRef<Map<string, boolean>>(new Map());
  const prevDueloIds    = useRef<Set<string>>(new Set());
  const prevDueloData   = useRef<Map<string, DueloEntry>>(new Map());

  /* ── Schedule a debounced progress save ──────────────────── */
  const scheduleSaveProgress = useCallback((uid: string) => {
    if (progressTimer.current) clearTimeout(progressTimer.current);
    progressTimer.current = setTimeout(() => {
      const payload = buildProgressPayload(store.getState());
      api.progress.save(uid, payload).catch(console.error);
    }, PROGRESS_DEBOUNCE_MS);
  }, [store]);

  /* ── Reset snapshot refs when user changes ───────────────── */
  function resetRefs() {
    prevTradeCount.current = 0;
    prevNotifIds.current   = new Set();
    prevNotifRead.current  = new Map();
    prevDueloIds.current   = new Set();
    prevDueloData.current  = new Map();
  }

  /* ── Load all data from DB on login ─────────────────────── */
  useEffect(() => {
    if (!userId) {
      resetRefs();
      return;
    }

    let cancelled = false;
    isLoading.current = true;

    async function load() {
      try {
        const [progressRes, tradesRes, notifsRes, duelosRes] = await Promise.allSettled([
          api.progress.get(userId!),
          api.trades.list(userId!),
          api.notifications.list(userId!),
          api.duelos.list(userId!),
        ]);

        if (cancelled) return;

        /* ── Apply progress ──────────────────────────────── */
        if (progressRes.status === "fulfilled") {
          const p = progressRes.value as Record<string, unknown>;
          store.setState((s) => ({
            progress: {
              ...s.progress,
              xp:               (p.xp              as number)  ?? s.progress.xp,
              streakDays:       (p.streakDays       as number)  ?? s.progress.streakDays,
              lastActivityDay:  (p.lastActivityDay  as string | null) ?? s.progress.lastActivityDay,
              perfectQuizCount: (p.perfectQuizCount as number)  ?? s.progress.perfectQuizCount,
              missionDate:      (p.missionDate      as string | null) ?? s.progress.missionDate,
              completedLessons: Array.isArray(p.completedLessons) ? p.completedLessons as string[] : s.progress.completedLessons,
              quizScores:       (p.quizScores        as Record<string,number>) ?? s.progress.quizScores,
              achievements:     Array.isArray(p.achievements)     ? p.achievements     as string[] : s.progress.achievements,
              reviewQueue:      Array.isArray(p.reviewQueue)      ? p.reviewQueue      as string[] : s.progress.reviewQueue,
              dailyMissions:    Array.isArray(p.dailyMissions)    ? p.dailyMissions    as typeof s.progress.dailyMissions : s.progress.dailyMissions,
            },
            onboarded:        typeof p.onboarded === "boolean"    ? p.onboarded        : s.onboarded,
            userLevel:        (p.userLevel as typeof s.userLevel) ?? s.userLevel,
            userInterests:    Array.isArray(p.userInterests)      ? p.userInterests    as string[] : s.userInterests,
            settings:         (p.settings  as typeof s.settings)  ?? s.settings,
            booksProgress:    (p.booksProgress as typeof s.booksProgress) ?? s.booksProgress,
            seenAchievements: Array.isArray(p.seenAchievements)   ? p.seenAchievements as string[] : s.seenAchievements,
            sim: {
              ...s.sim,
              cashBalance: typeof p.simCashBalance === "number" ? p.simCashBalance : s.sim.cashBalance,
            },
          }));
        }

        /* ── Apply trades ────────────────────────────────── */
        if (tradesRes.status === "fulfilled") {
          const dbTrades = tradesRes.value as Array<Record<string, unknown>>;
          if (dbTrades.length > 0) {
            store.setState((s) => {
              const existingIds = new Set(s.sim.history.map((t) => t.id));
              const newTrades = dbTrades
                .filter((t) => !existingIds.has(t.id as string))
                .map((t) => ({
                  id:         t.id         as string,
                  symbol:     t.symbol     as string,
                  side:       t.side       as "buy" | "sell",
                  size:       t.size       as number,
                  entryPrice: t.entryPrice as number,
                  exitPrice:  t.exitPrice  as number,
                  pnl:        t.pnl        as number,
                  openedAt:   t.openedAt   as number,
                  closedAt:   t.closedAt   as number,
                  reason:     t.reason     as "manual" | "stop" | "target" | "liquidation",
                  leverage:   (t.leverage  as number) ?? 1,
                  stopLoss:   t.stopLoss  != null ? (t.stopLoss  as number) : undefined,
                  takeProfit: t.takeProfit != null ? (t.takeProfit as number) : undefined,
                  note:       t.note != null ? (t.note as string) : undefined,
                }));
              return { sim: { ...s.sim, history: [...newTrades, ...s.sim.history] } };
            });
          }
          prevTradeCount.current = store.getState().sim.history.length;
        }

        /* ── Apply notifications ─────────────────────────── */
        if (notifsRes.status === "fulfilled") {
          const dbNotifs = notifsRes.value as Array<Record<string, unknown>>;
          const mapped: AppNotification[] = dbNotifs.map((n) => ({
            id:        n.id        as string,
            type:      n.type      as AppNotification["type"],
            title:     n.title     as string,
            message:   n.message   as string,
            createdAt: n.createdAt as number,
            read:      n.isRead === 1 || n.read === true,
            link:      n.link as string | undefined,
          }));
          store.setState({ notifications: mapped });
          prevNotifIds.current  = new Set(mapped.map((n) => n.id));
          prevNotifRead.current = new Map(mapped.map((n) => [n.id, n.read]));
        }

        /* ── Apply duelos ────────────────────────────────── */
        if (duelosRes.status === "fulfilled") {
          const dbDuelos = duelosRes.value as Array<Record<string, unknown>>;
          const mapped: DueloEntry[] = dbDuelos.map((d) => ({
            id:             d.id             as string,
            title:          d.title          as string,
            targetEquity:   d.targetEquity   as number,
            startBalance:   d.startBalance   as number,
            maxDrawdownPct: d.maxDrawdownPct as number,
            maxTrades:      d.maxTrades      as number,
            expiresAt:      d.expiresAt      as number,
            createdAt:      d.createdAt      as number,
            startEquity:    d.startEquity    as number,
            accepted:       d.accepted === 1 || d.accepted === true,
            code:           d.code           as string,
          }));
          store.setState({ duelos: mapped });
          prevDueloIds.current  = new Set(mapped.map((d) => d.id));
          prevDueloData.current = new Map(mapped.map((d) => [d.id, d]));
        }
      } catch (err) {
        console.error("[useDbSync] load error:", err);
      } finally {
        isLoading.current = false;
      }
    }

    load();
    return () => { cancelled = true; };
  }, [userId, store]);

  /* ── Watch progress and sync changes ─────────────────────── */
  useEffect(() => {
    if (!userId) return;

    return store.subscribe((state) => {
      if (isLoading.current) return;
      scheduleSaveProgress(userId);
    });
  }, [userId, store, scheduleSaveProgress]);

  /* ── Watch closed trades and sync new ones ───────────────── */
  useEffect(() => {
    if (!userId) return;

    return store.subscribe((state) => {
      if (isLoading.current) return;

      const currentCount = state.sim.history.length;
      if (currentCount > prevTradeCount.current) {
        const newTrades = state.sim.history.slice(0, currentCount - prevTradeCount.current);
        prevTradeCount.current = currentCount;
        api.trades.sync(userId, newTrades as unknown[]).catch(console.error);
      }
    });
  }, [userId, store]);

  /* ── Watch notifications and sync changes ────────────────── */
  useEffect(() => {
    if (!userId) return;

    return store.subscribe((state) => {
      if (isLoading.current) return;

      const current = state.notifications;
      const currentIds = new Set(current.map((n) => n.id));

      /* New notifications */
      for (const n of current) {
        if (!prevNotifIds.current.has(n.id)) {
          api.notifications.create(userId, {
            id:      n.id,
            type:    n.type,
            title:   n.title,
            message: n.message,
            link:    n.link ?? null,
          }).catch(console.error);
        }
      }

      /* Removed notifications */
      for (const id of prevNotifIds.current) {
        if (!currentIds.has(id)) {
          api.notifications.dismiss(userId, id).catch(console.error);
        }
      }

      /* Mark all read if all are now read and some were unread before */
      const allRead = current.every((n) => n.read);
      const someWereUnread = [...prevNotifRead.current.values()].some((r) => !r);
      if (allRead && someWereUnread && current.length > 0) {
        api.notifications.readAll(userId).catch(console.error);
      }

      prevNotifIds.current  = new Set(current.map((n) => n.id));
      prevNotifRead.current = new Map(current.map((n) => [n.id, n.read]));
    });
  }, [userId, store]);

  /* ── Watch duelos and sync changes ───────────────────────── */
  useEffect(() => {
    if (!userId) return;

    return store.subscribe((state) => {
      if (isLoading.current) return;

      const current = state.duelos;
      const currentIds = new Set(current.map((d) => d.id));

      /* New duelos */
      for (const d of current) {
        if (!prevDueloIds.current.has(d.id)) {
          api.duelos.create(userId, {
            title:          d.title,
            targetEquity:   d.targetEquity,
            startBalance:   d.startBalance,
            maxDrawdownPct: d.maxDrawdownPct,
            maxTrades:      d.maxTrades,
            expiresAt:      d.expiresAt,
            startEquity:    d.startEquity,
            accepted:       d.accepted,
            code:           d.code,
          }).catch(console.error);
        } else {
          /* Updated duelos (accepted flag or startEquity changed) */
          const prev = prevDueloData.current.get(d.id);
          if (prev && (prev.accepted !== d.accepted || prev.startEquity !== d.startEquity)) {
            api.duelos.update(userId, d.id, {
              accepted:    d.accepted,
              startEquity: d.startEquity,
            }).catch(console.error);
          }
        }
      }

      /* Removed duelos */
      for (const id of prevDueloIds.current) {
        if (!currentIds.has(id)) {
          api.duelos.remove(userId, id).catch(console.error);
        }
      }

      prevDueloIds.current  = new Set(current.map((d) => d.id));
      prevDueloData.current = new Map(current.map((d) => [d.id, d]));
    });
  }, [userId, store]);

  /* Cleanup debounce timer on unmount */
  useEffect(() => {
    return () => {
      if (progressTimer.current) clearTimeout(progressTimer.current);
    };
  }, []);
}
