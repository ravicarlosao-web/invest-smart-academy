import { Router, type Request, type Response, type NextFunction } from "express";
import {
  db,
  usersTable,
  progressTable,
  tradesTable,
  notificationsTable,
  duelosTable,
  adminSettingsTable,
  eq,
  desc,
  sql,
} from "@workspace/db";

const router = Router();

import { createHash } from "node:crypto";

const ADMIN_PASSWORD = process.env["ADMIN_PASSWORD"] ?? "admin123";
const ADMIN_TOKEN    = createHash("sha256").update(ADMIN_PASSWORD).digest("hex");

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = String(req.header("x-admin-token") ?? "");
  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: "unauthorized" });
  }
  next();
}

/* POST /api/admin/login */
router.post("/login", (req, res) => {
  const { passwordHash } = req.body as { passwordHash?: string };
  if (!passwordHash || passwordHash !== ADMIN_TOKEN) {
    return res.status(401).json({ error: "invalid_password" });
  }
  res.json({ ok: true });
});

router.use(requireAdmin);

/* ---------------------------------------------------------------------------
 * Generic key-value helpers for admin_settings
 * ------------------------------------------------------------------------- */
async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await db.select().from(adminSettingsTable).where(eq(adminSettingsTable.key, key)).get();
  if (!row) return fallback;
  try { return JSON.parse(row.value) as T; } catch { return fallback; }
}

async function setSetting(key: string, value: unknown): Promise<void> {
  const now = Date.now();
  await db
    .insert(adminSettingsTable)
    .values({ key, value: JSON.stringify(value), updatedAt: now })
    .onConflictDoUpdate({ target: adminSettingsTable.key, set: { value: JSON.stringify(value), updatedAt: now } });
}

/* ---------------------------------------------------------------------------
 * Overview
 * ------------------------------------------------------------------------- */
router.get("/overview", async (req, res) => {
  try {
    const [usersCnt]   = await db.select({ c: sql<number>`count(*)` }).from(usersTable).all();
    const [tradesCnt]  = await db.select({ c: sql<number>`count(*)` }).from(tradesTable).all();
    const [duelosCnt]  = await db.select({ c: sql<number>`count(*)` }).from(duelosTable).all();
    const [notifCnt]   = await db.select({ c: sql<number>`count(*)` }).from(notificationsTable).all();

    const progressRows = await db.select({
      xp:               progressTable.xp,
      streakDays:       progressTable.streakDays,
      completedLessons: progressTable.completedLessons,
    }).from(progressTable).all();

    const tradeRows = await db.select({
      pnl:    tradesTable.pnl,
      reason: tradesTable.reason,
    }).from(tradesTable).all();

    const totalUsers     = Number(usersCnt?.c ?? 0);
    const totalTrades    = Number(tradesCnt?.c ?? 0);
    const totalDuelos    = Number(duelosCnt?.c ?? 0);
    const totalNotifications = Number(notifCnt?.c ?? 0);

    const totalXp      = progressRows.reduce((s: number, r: any) => s + (r.xp ?? 0), 0);
    const avgXp        = progressRows.length ? totalXp / progressRows.length : 0;
    const totalLessons = progressRows.reduce(
      (s: number, r: any) => s + (JSON.parse(r.completedLessons || "[]") as unknown[]).length, 0,
    );
    const avgStreak    = progressRows.length
      ? progressRows.reduce((s: number, r: any) => s + (r.streakDays ?? 0), 0) / progressRows.length
      : 0;

    const wins   = tradeRows.filter((t: any) => (t.pnl ?? 0) > 0).length;
    const losses = tradeRows.filter((t: any) => (t.pnl ?? 0) <= 0).length;
    const liquidations = tradeRows.filter((t: any) => t.reason === "liquidation").length;
    const totalPnl = tradeRows.reduce((s: number, t: any) => s + (t.pnl ?? 0), 0);
    const winRate  = tradeRows.length ? wins / tradeRows.length : 0;

    res.json({
      totals: { users: totalUsers, trades: totalTrades, duelos: totalDuelos, notifications: totalNotifications },
      learning: { totalXp, avgXp, totalLessonsCompleted: totalLessons, avgStreak },
      simulator: { wins, losses, liquidations, totalPnl, winRate },
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/* ---------------------------------------------------------------------------
 * Users
 * ------------------------------------------------------------------------- */
router.get("/users", async (req, res) => {
  try {
    const users = await db.select({
      id: usersTable.id, name: usersTable.name, email: usersTable.email, createdAt: usersTable.createdAt,
    }).from(usersTable).orderBy(desc(usersTable.createdAt)).all();

    const progress = await db.select().from(progressTable).all();
    const progMap = new Map<string, any>(progress.map((p: any) => [p.userId, p]));

    const enriched = users.map((u: any) => {
      const p = progMap.get(u.id);
      return {
        ...u,
        xp:               p?.xp ?? 0,
        streakDays:       p?.streakDays ?? 0,
        lastActivityDay:  p?.lastActivityDay ?? null,
        completedLessons: p ? (JSON.parse(p.completedLessons || "[]") as unknown[]).length : 0,
        simCashBalance:   p?.simCashBalance ?? 10_000,
        onboarded:        p?.onboarded === 1,
      };
    });

    res.json(enriched);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

router.delete("/users/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    await db.delete(tradesTable).where(eq(tradesTable.userId, userId));
    await db.delete(notificationsTable).where(eq(notificationsTable.userId, userId));
    await db.delete(duelosTable).where(eq(duelosTable.userId, userId));
    await db.delete(progressTable).where(eq(progressTable.userId, userId));
    await db.delete(usersTable).where(eq(usersTable.id, userId));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

router.post("/users/:userId/reset-progress", async (req, res) => {
  try {
    await db.delete(progressTable).where(eq(progressTable.userId, req.params.userId));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

router.post("/users/:userId/reset-sim", async (req, res) => {
  try {
    await db.delete(tradesTable).where(eq(tradesTable.userId, req.params.userId));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/* Adjust user XP */
router.patch("/users/:userId/xp", async (req, res) => {
  try {
    const { xp } = req.body as { xp: number };
    if (typeof xp !== "number") return res.status(400).json({ error: "xp must be a number" });
    const existing = await db.select().from(progressTable).where(eq(progressTable.userId, req.params.userId)).get();
    if (!existing) return res.status(404).json({ error: "user_not_found" });
    await db.update(progressTable).set({ xp }).where(eq(progressTable.userId, req.params.userId));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/* ---------------------------------------------------------------------------
 * Simulator monitor
 * ------------------------------------------------------------------------- */
router.get("/simulator", async (req, res) => {
  try {
    const recent = await db.select().from(tradesTable).orderBy(desc(tradesTable.closedAt)).limit(50).all();

    const all = await db.select({ userId: tradesTable.userId, pnl: tradesTable.pnl }).from(tradesTable).all();
    const byUser = new Map<string, { pnl: number; trades: number }>();
    for (const t of all) {
      const cur = byUser.get(t.userId) ?? { pnl: 0, trades: 0 };
      cur.pnl    += t.pnl ?? 0;
      cur.trades += 1;
      byUser.set(t.userId, cur);
    }

    const userRows = await db.select({ id: usersTable.id, name: usersTable.name, email: usersTable.email }).from(usersTable).all();
    const userMap = new Map<string, any>(userRows.map((u: any) => [u.id, u]));

    const leaderboard = Array.from(byUser.entries())
      .map(([userId, agg]) => ({
        userId,
        name:  userMap.get(userId)?.name  ?? "—",
        email: userMap.get(userId)?.email ?? "—",
        pnl:   agg.pnl,
        trades: agg.trades,
      }))
      .sort((a, b) => b.pnl - a.pnl)
      .slice(0, 25);

    res.json({ recent, leaderboard });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/* ---------------------------------------------------------------------------
 * Curriculum overrides
 * ------------------------------------------------------------------------- */
router.get("/curriculum", async (req, res) => {
  try {
    res.json({ value: await getSetting("curriculum.override", { lessons: {} }) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

router.put("/curriculum", async (req, res) => {
  try {
    await setSetting("curriculum.override", req.body ?? { lessons: {} });
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/* ---------------------------------------------------------------------------
 * Strategies — stored as admin_settings key "content.strategies"
 * Value: array of Strategy objects (additional ones, merged with static)
 * ------------------------------------------------------------------------- */
router.get("/strategies", async (req, res) => {
  try {
    res.json(await getSetting("content.strategies", []));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

router.put("/strategies", async (req, res) => {
  try {
    const items = Array.isArray(req.body) ? req.body : [];
    await setSetting("content.strategies", items);
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/* ---------------------------------------------------------------------------
 * Books (Biblioteca) — stored as admin_settings key "content.books"
 * ------------------------------------------------------------------------- */
router.get("/books", async (req, res) => {
  try {
    res.json(await getSetting("content.books", []));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

router.put("/books", async (req, res) => {
  try {
    const items = Array.isArray(req.body) ? req.body : [];
    await setSetting("content.books", items);
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/* ---------------------------------------------------------------------------
 * Glossary — stored as admin_settings key "content.glossary"
 * ------------------------------------------------------------------------- */
router.get("/glossary", async (req, res) => {
  try {
    res.json(await getSetting("content.glossary", []));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

router.put("/glossary", async (req, res) => {
  try {
    const items = Array.isArray(req.body) ? req.body : [];
    await setSetting("content.glossary", items);
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/* ---------------------------------------------------------------------------
 * Resources — stored as admin_settings key "content.resources"
 * ------------------------------------------------------------------------- */
router.get("/resources", async (req, res) => {
  try {
    res.json(await getSetting("content.resources", []));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

router.put("/resources", async (req, res) => {
  try {
    const items = Array.isArray(req.body) ? req.body : [];
    await setSetting("content.resources", items);
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

export default router;
