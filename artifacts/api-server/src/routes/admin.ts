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

/* ---------------------------------------------------------------------------
 * Auth middleware
 *
 * Strategy: a single shared admin password (env ADMIN_PASSWORD, fallback
 * "admin123"). The client hashes it with SHA-256 and sends it in the header
 * `x-admin-token`. We compare against sha256(adminPassword) at boot.
 * ------------------------------------------------------------------------- */

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

/* POST /api/admin/login — verifies password without storing anything server-side */
router.post("/login", (req, res) => {
  const { passwordHash } = req.body as { passwordHash?: string };
  if (!passwordHash || passwordHash !== ADMIN_TOKEN) {
    return res.status(401).json({ error: "invalid_password" });
  }
  res.json({ ok: true });
});

/* All routes below require the admin token */
router.use(requireAdmin);

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
      simCashBalance:   progressTable.simCashBalance,
    }).from(progressTable).all();

    const tradeRows = await db.select({
      pnl:    tradesTable.pnl,
      reason: tradesTable.reason,
    }).from(tradesTable).all();

    const totalUsers       = Number(usersCnt?.c ?? 0);
    const totalTrades      = Number(tradesCnt?.c ?? 0);
    const totalDuelos      = Number(duelosCnt?.c ?? 0);
    const totalNotifications = Number(notifCnt?.c ?? 0);

    const totalXp        = progressRows.reduce((s: number, r) => s + (r.xp ?? 0), 0);
    const avgXp          = progressRows.length ? totalXp / progressRows.length : 0;
    const totalLessons   = progressRows.reduce(
      (s: number, r) => s + (JSON.parse(r.completedLessons || "[]") as unknown[]).length, 0,
    );
    const avgStreak      = progressRows.length
      ? progressRows.reduce((s: number, r) => s + (r.streakDays ?? 0), 0) / progressRows.length
      : 0;

    const wins   = tradeRows.filter((t) => (t.pnl ?? 0) > 0).length;
    const losses = tradeRows.filter((t) => (t.pnl ?? 0) <= 0).length;
    const liquidations = tradeRows.filter((t) => t.reason === "liquidation").length;
    const totalPnl = tradeRows.reduce((s: number, t) => s + (t.pnl ?? 0), 0);
    const winRate  = tradeRows.length ? wins / tradeRows.length : 0;

    res.json({
      totals: { users: totalUsers, trades: totalTrades, duelos: totalDuelos, notifications: totalNotifications },
      learning: {
        totalXp, avgXp,
        totalLessonsCompleted: totalLessons,
        avgStreak,
      },
      simulator: {
        wins, losses, liquidations, totalPnl, winRate,
      },
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
      id:        usersTable.id,
      name:      usersTable.name,
      email:     usersTable.email,
      createdAt: usersTable.createdAt,
    }).from(usersTable).orderBy(desc(usersTable.createdAt)).all();

    // join progress
    const progress = await db.select().from(progressTable).all();
    const progMap = new Map(progress.map((p) => [p.userId, p]));

    const enriched = users.map((u) => {
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

/* ---------------------------------------------------------------------------
 * Simulator monitor — recent trades + leaderboard
 * ------------------------------------------------------------------------- */
router.get("/simulator", async (req, res) => {
  try {
    const recent = await db
      .select()
      .from(tradesTable)
      .orderBy(desc(tradesTable.closedAt))
      .limit(50)
      .all();

    // simple leaderboard: aggregate pnl by user
    const all = await db.select({
      userId: tradesTable.userId,
      pnl:    tradesTable.pnl,
    }).from(tradesTable).all();

    const byUser = new Map<string, { pnl: number; trades: number }>();
    for (const t of all) {
      const cur = byUser.get(t.userId) ?? { pnl: 0, trades: 0 };
      cur.pnl    += t.pnl ?? 0;
      cur.trades += 1;
      byUser.set(t.userId, cur);
    }

    const userRows = await db.select({
      id: usersTable.id, name: usersTable.name, email: usersTable.email,
    }).from(usersTable).all();
    const userMap = new Map(userRows.map((u) => [u.id, u]));

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
 * Curriculum overrides — stored in admin_settings under key "curriculum.override"
 * Value is a JSON object: { lessons: { "<lessonId>": Partial<Lesson> } }
 * ------------------------------------------------------------------------- */
router.get("/curriculum", async (req, res) => {
  try {
    const row = await db
      .select()
      .from(adminSettingsTable)
      .where(eq(adminSettingsTable.key, "curriculum.override"))
      .get();

    res.json({ value: row ? JSON.parse(row.value) : { lessons: {} } });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

router.put("/curriculum", async (req, res) => {
  try {
    const value = JSON.stringify(req.body ?? { lessons: {} });
    const now = Date.now();
    await db
      .insert(adminSettingsTable)
      .values({ key: "curriculum.override", value, updatedAt: now })
      .onConflictDoUpdate({
        target: adminSettingsTable.key,
        set:    { value, updatedAt: now },
      });
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

export default router;
