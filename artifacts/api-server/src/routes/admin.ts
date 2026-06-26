// @ts-nocheck
import { Router, type Request, type Response, type NextFunction } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import {
  db,
  usersTable,
  progressTable,
  tradesTable,
  notificationsTable,
  duelosTable,
  adminSettingsTable,
  subscriptionsTable,
  plansTable,
  strategiesTable,
  glossaryTermsTable,
  booksTable,
  resourceSectionsTable,
  resourceItemsTable,
  curriculumLevelsTable,
  curriculumLessonsTable,
  professorLogsTable,
  videosTable,
  videoCategoriesTable,
  eq,
  desc,
  asc,
  and,
  sql,
} from "@workspace/db";

const router = Router();

import { AdminRejectBody, AdminXpBody } from "@workspace/api-zod";
import { sendSubscriptionApprovalEmail, sendSubscriptionRejectionEmail, sendTestEmail } from "../lib/email.js";
import { addBusinessDays } from "../lib/receiptPurge.js";
import { validate } from "../middlewares/validate.js";

function jsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

async function createNotif(userId: string, type: string, title: string, message: string, link?: string) {
  const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  try {
    await db.insert(notificationsTable).values({
      id, userId, type, title, message,
      link: link ?? null, isRead: 0, createdAt: Date.now(),
    });
  } catch { /* best-effort */ }
}

/**
 * Regista uma acção de conteúdo (professor/admin) na tabela professor_logs.
 * Melhor-esforço — nunca bloqueia a operação principal.
 */
async function logAction(
  req: any,
  action: string,
  resourceType: string,
  resourceName: string,
  details?: string,
): Promise<void> {
  try {
    const user = req.user;
    if (!user) return;
    const now = Date.now();
    const id  = `plog_${now}_${Math.random().toString(36).slice(2, 8)}`;
    await db.insert(professorLogsTable).values({
      id,
      professorId:    String(user.id    ?? ""),
      professorName:  String(user.name  ?? user.email ?? ""),
      professorEmail: String(user.email ?? ""),
      action,
      resourceType,
      resourceName,
      details: details ?? null,
      createdAt: now,
    });
  } catch { /* best-effort — nunca falha a operação principal */ }
}

/**
 * Guarda secundária para operações destrutivas / privilegiadas.
 * Professores passam o requireAuth/requireRole mas são bloqueados aqui.
 */
const requireAdminFull = requireRole("master", "administrador");

// Todas as rotas /api/admin requerem JWT válido + role elevado.
// requireAuth verifica a assinatura JWT E a lista de revogação (logout).
router.use(requireAuth, requireRole("master", "administrador", "professor"));

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
 * Criar conta admin/professor directamente (sem registo prévio)
 * Apenas master e administrador podem criar contas.
 * ------------------------------------------------------------------------- */
router.post("/create-account", requireAdminFull, async (req: any, res: any) => {
  try {
    const { name, email, password, role } = req.body ?? {};
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "missing_fields", message: "Nome, email, password e role são obrigatórios." });
    }
    if (!["administrador", "professor"].includes(role)) {
      return res.status(400).json({ error: "invalid_role", message: "Role deve ser 'administrador' ou 'professor'." });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ error: "password_too_short", message: "A password deve ter pelo menos 8 caracteres." });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, normalizedEmail)).get();
    if (existing) {
      return res.status(409).json({ error: "email_taken", message: "Este e-mail já está registado." });
    }

    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.default.hash(String(password), 12);
    const now = Date.now();
    const id  = `user_${now}_${Math.random().toString(36).slice(2, 7)}`;

    await db.insert(usersTable).values({
      id, name: String(name), email: normalizedEmail,
      passwordHash, emailVerified: 1,
      role: role as "administrador" | "professor",
      createdAt: now, updatedAt: now,
    });

    return res.status(201).json({
      ok: true,
      user: { id, name: String(name), email: normalizedEmail, role },
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "internal" });
  }
});

/* ---------------------------------------------------------------------------
 * Overview
 * ------------------------------------------------------------------------- */
router.get("/overview", requireAdminFull, async (req: any, res: any) => {
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
router.get("/users", requireAdminFull, async (req: any, res: any) => {
  try {
    const users = await db.select({
      id: usersTable.id, name: usersTable.name, email: usersTable.email, createdAt: usersTable.createdAt,
      role: usersTable.role,
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

router.delete("/users/:userId", requireAdminFull, async (req: any, res: any) => {
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

router.post("/users/:userId/reset-progress", requireAdminFull, async (req: any, res: any) => {
  try {
    await db.delete(progressTable).where(eq(progressTable.userId, String(req.params.userId)));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

router.post("/users/:userId/reset-sim", requireAdminFull, async (req: any, res: any) => {
  try {
    await db.delete(tradesTable).where(eq(tradesTable.userId, String(req.params.userId)));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/* Change user role — only administrador/master; "master" cannot be granted here */
router.patch("/users/:userId/role", requireAdminFull, async (req: any, res: any) => {
  try {
    const { userId } = req.params;
    const { role } = req.body ?? {};
    const validRoles = ["aluno", "professor", "administrador"];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ error: "invalid_role", message: `Role inválido. Valores aceites: ${validRoles.join(", ")}` });
    }
    const user = await db.select({ id: usersTable.id, role: usersTable.role }).from(usersTable).where(eq(usersTable.id, userId)).get();
    if (!user) return res.status(404).json({ error: "user_not_found" });
    await db.update(usersTable).set({ role, updatedAt: Date.now() }).where(eq(usersTable.id, userId));
    res.json({ ok: true, userId, role });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/* Verify user email manually (admin action) */
router.patch("/users/:userId/verify-email", requireAdminFull, async (req: any, res: any) => {
  try {
    const { userId } = req.params;
    const user = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, userId)).get();
    if (!user) return res.status(404).json({ error: "user_not_found" });
    await db.update(usersTable).set({ emailVerified: 1, updatedAt: Date.now() }).where(eq(usersTable.id, userId));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/* Adjust user XP */
router.patch("/users/:userId/xp", requireAdminFull, validate(AdminXpBody), async (req: any, res: any) => {
  try {
    const { xp } = req.body as { xp: number };
    const existing = await db.select().from(progressTable).where(eq(progressTable.userId, String(req.params.userId))).get();
    if (!existing) return res.status(404).json({ error: "user_not_found" });
    await db.update(progressTable).set({ xp }).where(eq(progressTable.userId, String(req.params.userId)));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/* ---------------------------------------------------------------------------
 * Simulator monitor
 * ------------------------------------------------------------------------- */
router.get("/simulator", requireAdminFull, async (req: any, res: any) => {
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
      .sort((a: any, b: any) => b.pnl - a.pnl)
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
router.get("/curriculum", async (req: any, res: any) => {
  try {
    res.json({ value: await getSetting("curriculum.override", { lessons: {} }) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

router.put("/curriculum", async (req: any, res: any) => {
  try {
    await setSetting("curriculum.override", req.body ?? { lessons: {} });
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/* ---------------------------------------------------------------------------
 * Curriculum DB — CRUD for levels and lessons
 * ------------------------------------------------------------------------- */
router.get("/curriculum-db", async (req: any, res: any) => {
  try {
    const levels  = await db.select().from(curriculumLevelsTable).orderBy(asc(curriculumLevelsTable.sortOrder)).all();
    const lessons = await db.select().from(curriculumLessonsTable).orderBy(asc(curriculumLessonsTable.sortOrder)).all();
    const result  = levels.map((lv: any) => ({
      id:         lv.id,
      title:      lv.title,
      subtitle:   lv.subtitle,
      difficulty: lv.difficulty,
      sortOrder:  lv.sortOrder,
      lessons: lessons
        .filter((ls: any) => ls.levelId === lv.id)
        .map((ls: any) => ({
          id:        ls.id,
          levelId:   ls.levelId,
          title:     ls.title,
          summary:   ls.summary,
          xp:        ls.xp,
          content:   (() => { try { return JSON.parse(ls.content); } catch { return []; } })(),
          questions: (() => { try { return JSON.parse(ls.questions); } catch { return []; } })(),
          sortOrder: ls.sortOrder,
        })),
    }));
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

router.post("/curriculum-db/levels", async (req: any, res: any) => {
  try {
    const { title, subtitle, difficulty } = req.body;
    const now = Date.now();
    const maxRow: any = await db.select({ m: sql`MAX(sort_order)` }).from(curriculumLevelsTable).get();
    const nextOrder = ((maxRow?.m ?? 0) as number) + 1;
    await db.insert(curriculumLevelsTable).values({
      title:      String(title      ?? "Novo Nível"),
      subtitle:   String(subtitle   ?? ""),
      difficulty: String(difficulty ?? "iniciante"),
      sortOrder:  nextOrder,
      createdAt:  now,
      updatedAt:  now,
    });
    logAction(req, "added", "curriculum_level", String(title ?? "Novo Nível"), `Dificuldade: ${difficulty ?? "iniciante"}`);
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

router.put("/curriculum-db/levels/:id", async (req: any, res: any) => {
  try {
    const id = Number(req.params.id);
    const { title, subtitle, difficulty, sortOrder } = req.body;
    const patch: Record<string, any> = { updatedAt: Date.now() };
    if (title      !== undefined) patch.title      = String(title);
    if (subtitle   !== undefined) patch.subtitle   = String(subtitle);
    if (difficulty !== undefined) patch.difficulty = String(difficulty);
    if (sortOrder  !== undefined) patch.sortOrder  = Number(sortOrder);
    await db.update(curriculumLevelsTable).set(patch).where(eq(curriculumLevelsTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

router.delete("/curriculum-db/levels/:id", async (req: any, res: any) => {
  try {
    const id = Number(req.params.id);
    const levelInfo: any = await db.select({ title: curriculumLevelsTable.title }).from(curriculumLevelsTable).where(eq(curriculumLevelsTable.id, id)).get();
    await db.delete(curriculumLessonsTable).where(eq(curriculumLessonsTable.levelId, id));
    await db.delete(curriculumLevelsTable).where(eq(curriculumLevelsTable.id, id));
    logAction(req, "removed", "curriculum_level", String(levelInfo?.title ?? `Nível #${id}`));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

router.post("/curriculum-db/lessons", async (req: any, res: any) => {
  try {
    const { levelId, title, summary, xp, content, questions } = req.body;
    const now      = Date.now();
    const lessonId = `${levelId}-${now}`;
    const maxRow: any = await db.select({ m: sql`MAX(sort_order)` })
      .from(curriculumLessonsTable)
      .where(eq(curriculumLessonsTable.levelId, Number(levelId)))
      .get();
    const nextOrder = ((maxRow?.m ?? 0) as number) + 1;
    await db.insert(curriculumLessonsTable).values({
      id:        lessonId,
      levelId:   Number(levelId),
      title:     String(title   ?? "Nova Lição"),
      summary:   String(summary ?? ""),
      xp:        Number(xp      ?? 20),
      content:   JSON.stringify(Array.isArray(content)   ? content   : []),
      questions: JSON.stringify(Array.isArray(questions) ? questions : []),
      sortOrder: nextOrder,
      createdAt: now,
      updatedAt: now,
    });
    logAction(req, "added", "curriculum_lesson", String(title ?? "Nova Lição"), `XP: ${xp ?? 20}`);
    res.json({ ok: true, id: lessonId });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

router.put("/curriculum-db/lessons/:id", async (req: any, res: any) => {
  try {
    const { id }     = req.params;
    const { title, summary, xp, content, questions, sortOrder } = req.body;
    const patch: Record<string, any> = { updatedAt: Date.now() };
    if (title     !== undefined) patch.title     = String(title);
    if (summary   !== undefined) patch.summary   = String(summary);
    if (xp        !== undefined) patch.xp        = Number(xp);
    if (content   !== undefined) patch.content   = JSON.stringify(Array.isArray(content)   ? content   : []);
    if (questions !== undefined) patch.questions  = JSON.stringify(Array.isArray(questions) ? questions : []);
    if (sortOrder !== undefined) patch.sortOrder  = Number(sortOrder);
    await db.update(curriculumLessonsTable).set(patch).where(eq(curriculumLessonsTable.id, String(id)));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

router.delete("/curriculum-db/lessons/:id", async (req: any, res: any) => {
  try {
    const lessonInfo: any = await db.select({ title: curriculumLessonsTable.title }).from(curriculumLessonsTable).where(eq(curriculumLessonsTable.id, String(req.params.id))).get();
    await db.delete(curriculumLessonsTable).where(eq(curriculumLessonsTable.id, String(req.params.id)));
    logAction(req, "removed", "curriculum_lesson", String(lessonInfo?.title ?? `Lição #${req.params.id}`));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/* ---------------------------------------------------------------------------
 * Strategies — read/write directly to strategiesTable
 * ------------------------------------------------------------------------- */
router.get("/strategies", async (req: any, res: any) => {
  try {
    const rows = await db.select().from(strategiesTable).orderBy(asc(strategiesTable.sortOrder)).all();
    res.json(rows.map((r: any) => ({
      id:             r.id,
      name:           r.name,
      subtitle:       r.subtitle,
      icon:           r.icon,
      timeframes:     jsonParse(r.timeframes, []),
      markets:        jsonParse(r.markets, []),
      riskLevel:      r.riskLevel,
      winRate:        r.winRate,
      riskReward:     r.riskReward,
      difficulty:     r.difficulty,
      description:    r.description,
      howItWorks:     r.howItWorks,
      setup:          jsonParse(r.setup, []),
      entrySignals:   jsonParse(r.entrySignals, []),
      exitSignals:    jsonParse(r.exitSignals, []),
      riskManagement: jsonParse(r.riskManagement, []),
      pros:           jsonParse(r.pros, []),
      cons:           jsonParse(r.cons, []),
      example:        r.example,
      tags:           jsonParse(r.tags, []),
      sortOrder:      r.sortOrder,
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

router.put("/strategies", async (req: any, res: any) => {
  try {
    const items: any[] = Array.isArray(req.body) ? req.body : [];
    const now = Date.now();
    const oldStrategies = await db.select({ id: strategiesTable.id, name: strategiesTable.name }).from(strategiesTable).all();
    await db.delete(strategiesTable);
    if (items.length > 0) {
      await db.insert(strategiesTable).values(items.map((it: any, i: any) => ({
        id:             String(it.id ?? crypto.randomUUID()),
        name:           String(it.name ?? ""),
        subtitle:       String(it.subtitle ?? ""),
        icon:           String(it.icon ?? ""),
        timeframes:     JSON.stringify(it.timeframes ?? []),
        markets:        JSON.stringify(it.markets ?? []),
        riskLevel:      String(it.riskLevel ?? ""),
        winRate:        String(it.winRate ?? ""),
        riskReward:     String(it.riskReward ?? ""),
        difficulty:     String(it.difficulty ?? ""),
        description:    String(it.description ?? ""),
        howItWorks:     String(it.howItWorks ?? ""),
        setup:          JSON.stringify(it.setup ?? []),
        entrySignals:   JSON.stringify(it.entrySignals ?? []),
        exitSignals:    JSON.stringify(it.exitSignals ?? []),
        riskManagement: JSON.stringify(it.riskManagement ?? []),
        pros:           JSON.stringify(it.pros ?? []),
        cons:           JSON.stringify(it.cons ?? []),
        example:        String(it.example ?? ""),
        tags:           JSON.stringify(it.tags ?? []),
        sortOrder:      typeof it.sortOrder === "number" ? it.sortOrder : i,
        createdAt:      now,
        updatedAt:      now,
      })));
    }
    // Logging: detectar o que foi adicionado/removido por comparação de IDs
    const oldIdSet = new Set(oldStrategies.map((r: any) => r.id));
    const newIdSet = new Set(items.filter((it: any) => it.id).map((it: any) => String(it.id)));
    const added    = items.filter((it: any) => it.id && !oldIdSet.has(String(it.id)));
    const removed  = oldStrategies.filter((r: any) => !newIdSet.has(r.id));
    for (const it of added)   logAction(req, "added",   "strategy", String(it.name || "Nova estratégia"));
    for (const it of removed) logAction(req, "removed", "strategy", String((it as any).name || "Estratégia"));
    if (added.length === 0 && removed.length === 0 && items.length > 0) {
      logAction(req, "updated", "strategy", `${items.length} estratégia(s)`);
    }
    res.json({ ok: true, count: items.length });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/* ---------------------------------------------------------------------------
 * Books (Biblioteca) — read/write directly to booksTable
 * ------------------------------------------------------------------------- */
router.get("/books", async (req: any, res: any) => {
  try {
    const rows = await db.select().from(booksTable).orderBy(asc(booksTable.orderNum)).all();
    res.json(rows.map((r: any) => ({
      id:          r.id,
      order:       r.orderNum,
      title:       r.title,
      author:      r.author,
      cover:       r.cover,
      category:    r.category,
      description: r.description,
      pages:       r.pages,
      docxFile:    r.docxFile ?? undefined,
      content:     r.content  ?? undefined,
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

router.put("/books", async (req: any, res: any) => {
  try {
    const items: any[] = Array.isArray(req.body) ? req.body : [];
    const now = Date.now();
    const oldBooks = await db.select({ id: booksTable.id, title: booksTable.title }).from(booksTable).all();
    await db.delete(booksTable);
    if (items.length > 0) {
      await db.insert(booksTable).values(items.map((it: any, i: any) => ({
        id:          String(it.id ?? crypto.randomUUID()),
        orderNum:    typeof it.order === "number" ? it.order : i + 1,
        title:       String(it.title ?? ""),
        author:      String(it.author ?? ""),
        cover:       String(it.cover ?? ""),
        category:    String(it.category ?? ""),
        description: String(it.description ?? ""),
        pages:       Number(it.pages ?? 0),
        docxFile:    it.docxFile ?? null,
        content:     it.content  ?? null,
        createdAt:   now,
        updatedAt:   now,
      })));
    }
    const oldBookIdSet = new Set(oldBooks.map((r: any) => r.id));
    const newBookIdSet = new Set(items.filter((it: any) => it.id).map((it: any) => String(it.id)));
    const addedBooks   = items.filter((it: any) => it.id && !oldBookIdSet.has(String(it.id)));
    const removedBooks = oldBooks.filter((r: any) => !newBookIdSet.has(r.id));
    for (const it of addedBooks)   logAction(req, "added",   "book", String(it.title || "Novo livro"));
    for (const it of removedBooks) logAction(req, "removed", "book", String((it as any).title || "Livro"));
    if (addedBooks.length === 0 && removedBooks.length === 0 && items.length > 0) {
      logAction(req, "updated", "book", `${items.length} livro(s)`);
    }
    res.json({ ok: true, count: items.length });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/* ---------------------------------------------------------------------------
 * Glossary — read/write directly to glossaryTermsTable
 * ------------------------------------------------------------------------- */
router.get("/glossary", async (req: any, res: any) => {
  try {
    const rows = await db.select().from(glossaryTermsTable).orderBy(asc(glossaryTermsTable.sortOrder)).all();
    res.json(rows.map((r: any) => ({
      id:         r.id,
      term:       r.term,
      definition: r.definition,
      category:   r.category,
      sortOrder:  r.sortOrder,
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

router.put("/glossary", async (req: any, res: any) => {
  try {
    const items: any[] = Array.isArray(req.body) ? req.body : [];
    const now = Date.now();
    const [oldGlossaryCount] = await db.select({ c: sql`COUNT(*)` }).from(glossaryTermsTable).all();
    const prevGlossaryCount  = Number((oldGlossaryCount as any)?.c ?? 0);
    await db.delete(glossaryTermsTable);
    if (items.length > 0) {
      /* glossaryTermsTable has autoIncrement PK — insert in batches of 100 */
      const BATCH = 100;
      for (let b = 0; b < items.length; b += BATCH) {
        await db.insert(glossaryTermsTable).values(
          items.slice(b, b + BATCH).map((it: any, i: any) => ({
            term:       String(it.term ?? ""),
            definition: String(it.definition ?? ""),
            category:   String(it.category ?? "Geral"),
            sortOrder:  typeof it.sortOrder === "number" ? it.sortOrder : b + i,
            createdAt:  now,
            updatedAt:  now,
          })),
        );
      }
    }
    const diffGlossary = items.length - prevGlossaryCount;
    if (diffGlossary > 0)      logAction(req, "added",   "glossary", `${diffGlossary} termo(s)`, `Total: ${items.length}`);
    else if (diffGlossary < 0) logAction(req, "removed", "glossary", `${Math.abs(diffGlossary)} termo(s)`, `Total: ${items.length}`);
    else if (items.length > 0) logAction(req, "updated", "glossary", `${items.length} termo(s)`);
    res.json({ ok: true, count: items.length });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/* ---------------------------------------------------------------------------
 * Resources — read/write directly to resourceSectionsTable + resourceItemsTable
 * ------------------------------------------------------------------------- */
router.get("/resources", async (req: any, res: any) => {
  try {
    const sections = await db.select().from(resourceSectionsTable).orderBy(asc(resourceSectionsTable.sortOrder)).all();
    const items    = await db.select().from(resourceItemsTable).orderBy(asc(resourceItemsTable.sortOrder)).all();
    res.json(sections.map((s: any) => ({
      id:    s.id,
      title: s.title,
      icon:  s.icon,
      color: s.color,
      items: items
        .filter((it: any) => it.sectionId === s.id)
        .map((it: any) => ({
          id:          it.id,
          name:        it.name,
          description: it.description,
          url:         it.url   ?? undefined,
          badge:       it.badge ?? undefined,
          stars:       it.stars ?? undefined,
          tags:        jsonParse(it.tags, []),
        })),
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

router.put("/resources", async (req: any, res: any) => {
  try {
    const sections: any[] = Array.isArray(req.body) ? req.body : [];
    const now = Date.now();
    const [oldResCount] = await db.select({ c: sql`COUNT(*)` }).from(resourceItemsTable).all();
    const prevResCount  = Number((oldResCount as any)?.c ?? 0);
    await db.delete(resourceItemsTable);
    await db.delete(resourceSectionsTable);
    for (let si = 0; si < sections.length; si++) {
      const s = sections[si];
      const sectionId = String(s.id ?? crypto.randomUUID());
      await db.insert(resourceSectionsTable).values({
        id:        sectionId,
        title:     String(s.title ?? ""),
        icon:      String(s.icon ?? ""),
        color:     String(s.color ?? ""),
        sortOrder: si,
        createdAt: now,
        updatedAt: now,
      });
      const sectionItems: any[] = Array.isArray(s.items) ? s.items : [];
      if (sectionItems.length > 0) {
        await db.insert(resourceItemsTable).values(
          sectionItems.map((it: any, ii: any) => ({
            sectionId,
            name:        String(it.name ?? ""),
            description: String(it.description ?? ""),
            url:         it.url   ?? null,
            badge:       it.badge ?? null,
            stars:       it.stars != null ? Number(it.stars) : null,
            tags:        JSON.stringify(it.tags ?? []),
            sortOrder:   ii,
            createdAt:   now,
            updatedAt:   now,
          })),
        );
      }
    }
    const newResCount = sections.reduce((sum: number, s: any) => sum + (Array.isArray(s.items) ? s.items.length : 0), 0);
    const diffRes = newResCount - prevResCount;
    if (diffRes > 0)        logAction(req, "added",   "resource", `${diffRes} recurso(s)`, `Secções: ${sections.length}`);
    else if (diffRes < 0)   logAction(req, "removed", "resource", `${Math.abs(diffRes)} recurso(s)`, `Secções: ${sections.length}`);
    else if (newResCount > 0) logAction(req, "updated", "resource", `${newResCount} recurso(s)`);
    res.json({ ok: true, sections: sections.length });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/* ---------------------------------------------------------------------------
 * Video Categories — CRUD para categorias dinâmicas de vídeo aulas
 * ------------------------------------------------------------------------- */
/* GET — professores também podem ler as categorias (necessário no editor de vídeos) */
router.get("/video-categories", async (req: any, res: any) => {
  try {
    const rows = await db
      .select()
      .from(videoCategoriesTable)
      .orderBy(asc(videoCategoriesTable.sortOrder))
      .all();
    res.json(rows.map((r: any) => ({
      id:        r.id,
      name:      r.name,
      sortOrder: r.sortOrder,
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/* POST/DELETE — apenas master e administrador podem gerir categorias globais */
router.post("/video-categories", requireAdminFull, async (req: any, res: any) => {
  try {
    const { name } = req.body ?? {};
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "missing_name", message: "O nome da categoria é obrigatório." });
    }
    const trimmed = name.trim();

    // Check duplicate
    const existing = await db
      .select({ id: videoCategoriesTable.id })
      .from(videoCategoriesTable)
      .where(eq(videoCategoriesTable.name, trimmed))
      .get();
    if (existing) {
      return res.status(409).json({ error: "duplicate", message: "Já existe uma categoria com este nome." });
    }

    const now = Date.now();
    const maxRow: any = await db.select({ m: sql`MAX(sort_order)` }).from(videoCategoriesTable).get();
    const nextOrder = ((maxRow?.m ?? 0) as number) + 1;
    const id = `vcat_${now}_${Math.random().toString(36).slice(2, 8)}`;

    await db.insert(videoCategoriesTable).values({
      id,
      name:      trimmed,
      iconKey:   "Video",
      sortOrder: nextOrder,
      createdAt: now,
      updatedAt: now,
    });

    logAction(req, "added", "video_category", trimmed);
    res.status(201).json({ ok: true, id });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

router.delete("/video-categories/:id", requireAdminFull, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const cat = await db
      .select({ name: videoCategoriesTable.name })
      .from(videoCategoriesTable)
      .where(eq(videoCategoriesTable.id, id))
      .get();
    if (!cat) return res.status(404).json({ error: "not_found" });

    // Reassign all videos in this category to "Geral" before deleting
    await db.run(sql.raw(
      `UPDATE videos SET category = 'Geral', updated_at = ${Date.now()} WHERE category = '${cat.name.replace(/'/g, "''")}'`
    ));

    await db.delete(videoCategoriesTable).where(eq(videoCategoriesTable.id, id));
    logAction(req, "removed", "video_category", cat.name);
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/* ---------------------------------------------------------------------------
 * Video Aulas — stored as admin_settings key "content.videos"
 * Public GET is exposed at /videos (see routes/index.ts)
 * ------------------------------------------------------------------------- */
router.get("/videos", async (req: any, res: any) => {
  try {
    res.json(await getSetting("content.videos", []));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

router.put("/videos", async (req: any, res: any) => {
  try {
    const items: any[] = Array.isArray(req.body) ? req.body : [];
    const prevVideos: any[] = await getSetting("content.videos", []);
    const prevVideoCount = prevVideos.length;

    // 1. Guarda em admin_settings (fonte do painel admin)
    await setSetting("content.videos", items);

    // 2. Sincroniza com videosTable (fonte dos alunos)
    const now = Date.now();
    const incomingIds = new Set<string>(items.map((v: any) => String(v.id)).filter(Boolean));

    // Upsert de cada vídeo
    for (let i = 0; i < items.length; i++) {
      const v = items[i];
      if (!v?.id || !v?.title) continue;
      await db.run(sql.raw(
        `INSERT INTO videos (id, creator, title, level, category, tags, video_url, description, sort_order, created_at, updated_at)
         VALUES (
           '${String(v.id).replace(/'/g,"''")}',
           '${String(v.creator ?? "Desconhecido").replace(/'/g,"''")}',
           '${String(v.title).replace(/'/g,"''")}',
           '${String(v.level ?? "Iniciante").replace(/'/g,"''")}',
           '${String(v.category ?? "Geral").replace(/'/g,"''")}',
           '${JSON.stringify(Array.isArray(v.tags) ? v.tags : []).replace(/'/g,"''")}',
           '${String(v.videoUrl ?? v.youtubeUrl ?? "").replace(/'/g,"''")}',
           ${v.description ? `'${String(v.description).replace(/'/g,"''")}'` : "NULL"},
           ${Number.isFinite(v.order) ? v.order : i},
           ${now}, ${now}
         )
         ON CONFLICT(id) DO UPDATE SET
           creator     = excluded.creator,
           title       = excluded.title,
           level       = excluded.level,
           category    = excluded.category,
           tags        = excluded.tags,
           video_url   = excluded.video_url,
           description = excluded.description,
           sort_order  = excluded.sort_order,
           updated_at  = excluded.updated_at`
      ));
    }

    // Remove vídeos apagados pelo admin
    const allInTable = await db.select({ id: videosTable.id }).from(videosTable).all();
    for (const row of allInTable) {
      if (!incomingIds.has(row.id)) {
        await db.delete(videosTable).where(eq(videosTable.id, row.id));
      }
    }

    const diffVid = items.length - prevVideoCount;
    if (diffVid > 0)           logAction(req, "added",   "video", `${diffVid} vídeo(s)`, `Total: ${items.length}`);
    else if (diffVid < 0)      logAction(req, "removed", "video", `${Math.abs(diffVid)} vídeo(s)`, `Total: ${items.length}`);
    else if (items.length > 0) logAction(req, "updated", "video", `${items.length} vídeo(s)`);

    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/* ---------------------------------------------------------------------------
 * Subscrições — gestão manual de pagamentos (15.000 AOA/mês)
 * ------------------------------------------------------------------------- */

/** GET /api/admin/subscriptions  — lista todas as subscrições com info do utilizador e plano */
router.get("/subscriptions", requireAdminFull, async (req: any, res: any) => {
  try {
    const now    = Date.now();
    const status = req.query.status as string | undefined;

    const subs = await db.select().from(subscriptionsTable).orderBy(desc(subscriptionsTable.createdAt)).all();

    // Marca expiradas
    for (const sub of subs) {
      if (sub.status === "active" && sub.expiresAt && sub.expiresAt < now) {
        await db.update(subscriptionsTable).set({ status: "expired", updatedAt: now }).where(eq(subscriptionsTable.id, sub.id));
        sub.status = "expired";
      }
    }

    // Join com users
    const users = await db.select({ id: usersTable.id, name: usersTable.name, email: usersTable.email }).from(usersTable).all();
    const userMap = Object.fromEntries(users.map((u: any) => [u.id, u]));

    // Join com plans
    const plans = await db.select({ id: plansTable.id, name: plansTable.name }).from(plansTable).all();
    const planMap = Object.fromEntries(plans.map((p: any) => [p.id, p.name]));

    const result = subs
      .filter((s: any) => !status || s.status === status)
      .map((s: any) => {
        const { receiptData: _rd, ...rest } = s;
        return {
          ...rest,
          hasReceipt: !!s.receiptData,
          planName: s.planId ? (planMap[s.planId] ?? null) : null,
          user: userMap[s.userId] ?? { id: s.userId, name: "—", email: "—" },
        };
      });

    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/** GET /api/admin/subscriptions/:id/receipt — devolve comprovativo */
router.get("/subscriptions/:id/receipt", requireAdminFull, async (req: any, res: any) => {
  try {
    const sub = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.id, String(req.params.id)))
      .get();

    if (!sub || !sub.receiptData) {
      return res.status(404).json({ error: "receipt_not_found" });
    }

    res.json({
      receiptData:     sub.receiptData,
      receiptMimeType: sub.receiptMimeType,
      receiptFilename: sub.receiptFilename,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/** GET /api/admin/subscriptions/stats — contagem por status */
router.get("/subscriptions/stats", requireAdminFull, async (req: any, res: any) => {
  try {
    const now  = Date.now();
    const subs = await db.select().from(subscriptionsTable).all();

    // Marca expiradas
    for (const sub of subs) {
      if (sub.status === "active" && sub.expiresAt && sub.expiresAt < now) {
        await db.update(subscriptionsTable).set({ status: "expired", updatedAt: now }).where(eq(subscriptionsTable.id, sub.id));
        sub.status = "expired";
      }
    }

    const stats = { pending: 0, active: 0, expired: 0, rejected: 0, total: subs.length };
    for (const sub of subs) {
      if (sub.status === "pending")  stats.pending++;
      if (sub.status === "active")   stats.active++;
      if (sub.status === "expired")  stats.expired++;
      if (sub.status === "rejected") stats.rejected++;
    }

    res.json(stats);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/** PATCH /api/admin/subscriptions/:id/approve — aprova com planId opcional */
router.patch("/subscriptions/:id/approve", requireAdminFull, async (req: any, res: any) => {
  try {
    const now            = Date.now();
    const receiptPurgeAt = addBusinessDays(now, 2);

    const sub = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.id, String(req.params.id))).get();
    if (!sub) return res.status(404).json({ error: "not_found" });

    /* Resolve planId — prioridade: (1) guardado na sub, (2) body override, (3) plano pago mais barato */
    let resolvedPlanId: string | null = sub.planId ?? req.body?.planId ?? null;
    if (!resolvedPlanId) {
      const paidPlan = await db
        .select({ id: plansTable.id })
        .from(plansTable)
        .where(and(eq(plansTable.isActive, 1), eq(plansTable.isDefault, 0)))
        .orderBy(asc(plansTable.priceAoa))
        .limit(1)
        .get();
      resolvedPlanId = paidPlan?.id ?? null;
    }

    /* Calcula expiresAt usando durationDays do plano (fallback: 30 dias) */
    let durationDays = 30;
    if (resolvedPlanId) {
      const plan = await db
        .select({ durationDays: plansTable.durationDays })
        .from(plansTable)
        .where(eq(plansTable.id, resolvedPlanId))
        .get();
      if (plan) durationDays = plan.durationDays;
    }
    const expiresAt = now + durationDays * 24 * 60 * 60 * 1000;

    await db.update(subscriptionsTable).set({
      status:          "active",
      planId:          resolvedPlanId,
      approvedAt:      now,
      expiresAt,
      receiptPurgeAt,
      updatedAt:       now,
    }).where(eq(subscriptionsTable.id, String(req.params.id)));

    /* Notificação in-app para o aluno */
    const expireDate = new Date(expiresAt).toLocaleDateString("pt-PT");
    await createNotif(
      sub.userId, "system",
      "Subscrição Activada! 🎉",
      `A tua subscrição foi aprovada. Tens acesso completo ao conteúdo Intermédio e Avançado até ${expireDate}.`,
      "/aprender",
    );

    /* Email de confirmação (fire-and-forget) */
    const userRow = await db.select({ email: usersTable.email, name: usersTable.name })
      .from(usersTable).where(eq(usersTable.id, sub.userId)).get();
    if (userRow?.email) {
      sendSubscriptionApprovalEmail({ to: userRow.email, name: userRow.name ?? "utilizador", expiresAt })
        .then((r) => { if (!r.ok) console.warn("[email] approval failed:", r.reason); })
        .catch(() => {});
    }

    res.json({ ok: true, expiresAt });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/** PATCH /api/admin/subscriptions/:id/reject — rejeita com nota opcional */
router.patch("/subscriptions/:id/reject", requireAdminFull, validate(AdminRejectBody), async (req: any, res: any) => {
  try {
    const { notes } = req.body;
    const now            = Date.now();
    const receiptPurgeAt = addBusinessDays(now, 2); // comprovativo eliminado após 2 dias úteis

    const sub = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.id, String(req.params.id))).get();
    if (!sub) return res.status(404).json({ error: "not_found" });

    await db.update(subscriptionsTable).set({
      status:          "rejected",
      notes:           notes ?? null,
      receiptPurgeAt,
      updatedAt:       now,
    }).where(eq(subscriptionsTable.id, String(req.params.id)));

    /* Notificação in-app para o aluno */
    const noteText = notes ? ` Motivo: ${notes}` : " Contacta o suporte para mais informações.";
    await createNotif(
      sub.userId, "system",
      "Pedido de subscrição rejeitado",
      `O teu pedido de subscrição foi rejeitado.${noteText}`,
      "/perfil",
    );

    /* Email de rejeição (fire-and-forget) */
    const userRowR = await db.select({ email: usersTable.email, name: usersTable.name })
      .from(usersTable).where(eq(usersTable.id, sub.userId)).get();
    if (userRowR?.email) {
      sendSubscriptionRejectionEmail({ to: userRowR.email, name: userRowR.name ?? "utilizador", notes: notes ?? undefined })
        .then((r) => { if (!r.ok) console.warn("[email] rejection email failed:", r.reason); })
        .catch(() => {});
    }

    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/* ---------------------------------------------------------------------------
 * Plan Config — GET/PUT /admin/plan-config
 * Stores { priceAoa, planName } in admin_settings under key "plan.config"
 * LEGADO — substituído por tabela plans; mantido por compatibilidade com frontend antigo
 * ------------------------------------------------------------------------- */
router.get("/plan-config", requireAdminFull, async (req: any, res: any) => {
  try {
    const cfg = await getSetting<{ priceAoa: number; planName: string }>(
      "plan.config",
      { priceAoa: 15000, planName: "Plano Mensal" },
    );
    res.json(cfg);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

router.put("/plan-config", requireAdminFull, async (req: any, res: any) => {
  try {
    const { priceAoa, planName } = req.body as { priceAoa?: number; planName?: string };
    if (priceAoa !== undefined && (typeof priceAoa !== "number" || priceAoa <= 0)) {
      return res.status(400).json({ error: "invalid_price" });
    }
    const current = await getSetting<{ priceAoa: number; planName: string }>(
      "plan.config",
      { priceAoa: 15000, planName: "Plano Mensal" },
    );
    await setSetting("plan.config", {
      priceAoa: priceAoa ?? current.priceAoa,
      planName: planName ?? current.planName,
    });
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/* ---------------------------------------------------------------------------
 * Bank Config — GET/PUT /admin/bank-config
 * Stores { banco, conta, titular, iban, descricao } under key "bank.config"
 * ------------------------------------------------------------------------- */
const BANK_DEFAULTS = {
  banco:     "Banco BFA",
  conta:     "",
  titular:   "",
  iban:      "",
  descricao: "Mensalidade ALUKA",
};

router.get("/bank-config", requireAdminFull, async (req: any, res: any) => {
  try {
    const cfg = await getSetting<typeof BANK_DEFAULTS>("bank.config", BANK_DEFAULTS);
    res.json(cfg);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

router.put("/bank-config", requireAdminFull, async (req: any, res: any) => {
  try {
    const { banco, conta, titular, iban, descricao } = req.body as Partial<typeof BANK_DEFAULTS>;
    const current = await getSetting<typeof BANK_DEFAULTS>("bank.config", BANK_DEFAULTS);
    await setSetting("bank.config", {
      banco:     banco     !== undefined ? banco     : current.banco,
      conta:     conta     !== undefined ? conta     : current.conta,
      titular:   titular   !== undefined ? titular   : current.titular,
      iban:      iban      !== undefined ? iban      : current.iban,
      descricao: descricao !== undefined ? descricao : current.descricao,
    });
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/* ---------------------------------------------------------------------------
 * Finance Overview — GET /admin/finance
 * Revenue summary combining subscription stats with plan pricing
 * ------------------------------------------------------------------------- */
router.get("/finance", requireAdminFull, async (req: any, res: any) => {
  try {
    const cfg = await getSetting<{ priceAoa: number; planName: string }>(
      "plan.config",
      { priceAoa: 15000, planName: "Plano Mensal" },
    );

    const subs = await db.select({
      id:        subscriptionsTable.id,
      status:    subscriptionsTable.status,
      amount:    subscriptionsTable.amount,
      createdAt: subscriptionsTable.createdAt,
      expiresAt: subscriptionsTable.expiresAt,
    }).from(subscriptionsTable).all();

    const now = Date.now();

    /* Persistir expiração de subscrições activas já vencidas */
    for (const sub of subs as any[]) {
      if (sub.status === "active" && sub.expiresAt != null && sub.expiresAt <= now) {
        await db
          .update(subscriptionsTable)
          .set({ status: "expired", updatedAt: now })
          .where(eq(subscriptionsTable.id, sub.id));
        sub.status = "expired";
      }
    }

    const active   = subs.filter((s: any) => s.status === "active" && (s.expiresAt == null || s.expiresAt > now));
    const pending  = subs.filter((s: any) => s.status === "pending");
    const expired  = subs.filter((s: any) => s.status === "expired" || (s.status === "active" && s.expiresAt != null && s.expiresAt <= now));
    const rejected = subs.filter((s: any) => s.status === "rejected");

    const totalReceived = [...active, ...expired]
      .reduce((sum: number, s: any) => sum + (Number(s.amount) || cfg.priceAoa), 0);
    const pendingRevenue = pending
      .reduce((sum: number, s: any) => sum + (Number(s.amount) || cfg.priceAoa), 0);
    const mrr = active.length * cfg.priceAoa;

    // 30-day new subscribers trend
    const cutoff30 = now - 30 * 24 * 60 * 60 * 1000;
    const newLast30 = subs.filter((s: any) => Number(s.createdAt) >= cutoff30).length;
    const newActiveLast30 = active.filter((s: any) => Number(s.createdAt) >= cutoff30).length;

    res.json({
      plan: cfg,
      counts: {
        total:   subs.length,
        active:  active.length,
        pending: pending.length,
        expired: expired.length,
        rejected: rejected.length,
      },
      revenue: {
        mrr,
        totalReceived,
        pendingRevenue,
        newLast30,
        newActiveLast30,
      },
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/* ---------------------------------------------------------------------------
 * AI Config — GET/PUT /admin/ai-config
 * POST /admin/ai-config/test — validates a Gemini key
 * Stores { geminiTextKey, geminiTextEnabled, geminiImageKey, geminiImageEnabled }
 * in admin_settings under key "ai.config"
 * ------------------------------------------------------------------------- */

type AiCfg = {
  geminiTextKey: string;  geminiTextEnabled: boolean;
  geminiImageKey: string; geminiImageEnabled: boolean;
};
const AI_CFG_DEFAULT: AiCfg = {
  geminiTextKey: "", geminiTextEnabled: false,
  geminiImageKey: "", geminiImageEnabled: false,
};

function maskKey(key: string): string {
  if (!key) return "";
  if (key.length <= 12) return "•".repeat(key.length);
  return key.slice(0, 8) + "•".repeat(Math.min(key.length - 12, 20)) + key.slice(-4);
}

router.get("/ai-config", requireAdminFull, async (req: any, res: any) => {
  try {
    const stored = await getSetting<Partial<AiCfg>>("ai.config", {});
    const cfg: AiCfg = { ...AI_CFG_DEFAULT, ...stored };
    /* Coerce to string in case persisted data contains null/non-string values */
    const textKey  = typeof cfg.geminiTextKey  === "string" ? cfg.geminiTextKey  : "";
    const imageKey = typeof cfg.geminiImageKey === "string" ? cfg.geminiImageKey : "";
    res.json({
      textConfigured:  textKey.length  > 0,
      textEnabled:     cfg.geminiTextEnabled,
      textKeyPreview:  maskKey(textKey),
      imageConfigured: imageKey.length > 0,
      imageEnabled:    cfg.geminiImageEnabled,
      imageKeyPreview: maskKey(imageKey),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

router.put("/ai-config", requireAdminFull, async (req: any, res: any) => {
  try {
    const { geminiTextKey, geminiTextEnabled, geminiImageKey, geminiImageEnabled } =
      req.body as Partial<AiCfg>;
    const current: AiCfg = { ...AI_CFG_DEFAULT, ...await getSetting<Partial<AiCfg>>("ai.config", {}) };
    await setSetting("ai.config", {
      geminiTextKey:     geminiTextKey  !== undefined ? geminiTextKey.trim()  : current.geminiTextKey,
      geminiTextEnabled: geminiTextEnabled !== undefined ? geminiTextEnabled   : current.geminiTextEnabled,
      geminiImageKey:    geminiImageKey !== undefined ? geminiImageKey.trim() : current.geminiImageKey,
      geminiImageEnabled: geminiImageEnabled !== undefined ? geminiImageEnabled : current.geminiImageEnabled,
    });
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

router.post("/ai-config/test", requireAdminFull, async (req: any, res: any) => {
  try {
    const { type = "text" } = req.body as { type?: "text" | "image" };
    const cfg: AiCfg = { ...AI_CFG_DEFAULT, ...await getSetting<Partial<AiCfg>>("ai.config", {}) };
    const key = type === "image" ? cfg.geminiImageKey : cfg.geminiTextKey;
    if (!key) {
      return res.status(400).json({ error: "no_key", message: "Nenhuma chave configurada para este modelo." });
    }

    /* Use generateContent with a minimal prompt to detect quota issues,
       invalid keys, and model availability — GET /models only validates
       the key format but not quota or generateContent permissions. */
    const model = "gemini-2.5-flash-lite";
    const testRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Hi" }] }],
          generationConfig: { maxOutputTokens: 5 },
        }),
      },
    );

    if (!testRes.ok) {
      const body = await testRes.json().catch(() => ({})) as any;
      const status  = testRes.status;
      const message = body?.error?.message ?? "Chave inválida ou sem permissões.";

      if (status === 429) {
        return res.status(429).json({
          error: "quota_exceeded",
          message: "Quota esgotada para esta chave. Aguarda o reset diário ou usa outra chave.",
        });
      }
      if (status === 400 || status === 403) {
        return res.status(400).json({ error: "invalid_key", message });
      }
      return res.status(400).json({ error: "api_error", message });
    }

    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/* ===========================================================================
 * Email Config — GET / PUT /api/admin/email-config
 * POST /api/admin/email-config/test
 * ========================================================================= */

/** GET /api/admin/email-config — returns config status (never returns passwords) */
router.get("/email-config", requireAdminFull, async (req: any, res: any) => {
  try {
    const row = await db.select().from(adminSettingsTable).where(eq(adminSettingsTable.key, "email.config")).get();
    let cfg: any = {};
    try { cfg = row ? JSON.parse(row.value) : {}; } catch { cfg = {}; }
    const envPass = process.env["GMAIL_APP_PASSWORD"];
    const hasDbPass = !!cfg.gmailAppPassword;
    const hasEnvPass = !!envPass;
    res.json({
      configured:     hasDbPass || hasEnvPass,
      keySource:      hasDbPass ? "database" : hasEnvPass ? "environment" : "none",
      gmailUser:      cfg.gmailUser  ?? "aluka.co.ao@gmail.com",
      fromName:       cfg.fromName   ?? "ALUKA",
      adminEmail:     cfg.adminEmail ?? "",
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/** PUT /api/admin/email-config — saves Gmail SMTP config (gmailAppPassword may be empty to keep existing) */
router.put("/email-config", requireAdminFull, async (req: any, res: any) => {
  try {
    const { gmailAppPassword, gmailUser, fromName, adminEmail } = req.body ?? {};
    const now = Date.now();

    const existing = await db.select().from(adminSettingsTable).where(eq(adminSettingsTable.key, "email.config")).get();
    let current: any = {};
    try { current = existing ? JSON.parse(existing.value) : {}; } catch { current = {}; }

    const merged = {
      gmailUser:        gmailUser        ?? current.gmailUser        ?? "aluka.co.ao@gmail.com",
      gmailAppPassword: gmailAppPassword ?? current.gmailAppPassword ?? "",
      fromName:         fromName         ?? current.fromName         ?? "ALUKA",
      adminEmail:       adminEmail       ?? current.adminEmail       ?? "",
    };

    if (existing) {
      await db.update(adminSettingsTable).set({ value: JSON.stringify(merged), updatedAt: now }).where(eq(adminSettingsTable.key, "email.config"));
    } else {
      await db.insert(adminSettingsTable).values({ key: "email.config", value: JSON.stringify(merged), updatedAt: now });
    }

    const envPass = process.env["GMAIL_APP_PASSWORD"];
    res.json({ ok: true, configured: !!(merged.gmailAppPassword || envPass) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/** POST /api/admin/email-config/test — sends test email to adminEmail */
router.post("/email-config/test", requireAdminFull, async (req: any, res: any) => {
  try {
    const { to } = req.body ?? {};
    if (!to || typeof to !== "string") return res.status(400).json({ error: "missing_to" });
    const result = await sendTestEmail({ to });
    if (!result.ok) return res.status(400).json({ error: "send_failed", reason: result.reason });
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/* ===========================================================================
 * SEO / Site Config — GET / PUT /api/admin/seo-config
 * Stored in admin_settings key "seo.config"
 * ========================================================================= */

const SEO_DEFAULTS = {
  siteName:      "TradeAcademy Angola",
  shortName:     "TradeAcademy",
  domain:        "",
  description:   "A primeira plataforma angolana de educação em trading. Aulas gratuitas de Forex, acções e cripto, simulador com $10.000 demo, estratégias profissionais. 100% em português.",
  twitterHandle: "@TradeAcademyAO",
  themeColor:    "#06b6d4",
  priceAoa:      15000,
  geo:           "AO",
  geoCity:       "Luanda, Angola",
};

/* =========================================================================
 * Google OAuth configuration
 * ========================================================================= */
router.get("/google-oauth", requireAdminFull, async (req: any, res: any) => {
  try {
    const row = await db.select().from(adminSettingsTable).where(eq(adminSettingsTable.key, "auth.google")).get();
    let cfg: any = {};
    try { cfg = row ? JSON.parse(row.value) : {}; } catch { cfg = {}; }

    /* Build callback URL hint */
    const proto = (req.headers["x-forwarded-proto"] as string | undefined)?.split(",")[0]?.trim() ?? req.protocol ?? "https";
    const host  = (req.headers["x-forwarded-host"] as string | undefined) ?? (req.headers["host"] as string) ?? "";
    const callbackUrl = `${proto}://${host}/api-server/api/auth/google/callback`;

    res.json({
      clientId:            cfg.clientId ?? "",
      clientSecretPreview: cfg.clientSecret ? `${"•".repeat(Math.max(0, cfg.clientSecret.length - 4))}${cfg.clientSecret.slice(-4)}` : "",
      enabled:             cfg.enabled === true,
      configured:          !!(cfg.clientId && cfg.clientSecret),
      callbackUrl,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/** POST /api/admin/google-oauth/test — validates stored credentials against Google */
router.post("/google-oauth/test", requireAdminFull, async (req: any, res: any) => {
  try {
    const row = await db.select().from(adminSettingsTable).where(eq(adminSettingsTable.key, "auth.google")).get();
    let cfg: any = {};
    try { cfg = row ? JSON.parse(row.value) : {}; } catch { cfg = {}; }

    if (!cfg.clientId || !cfg.clientSecret) {
      return res.status(400).json({ error: "not_configured", message: "Client ID e Client Secret são obrigatórios." });
    }

    /* Basic format validation */
    if (!cfg.clientId.endsWith(".apps.googleusercontent.com")) {
      return res.status(400).json({
        error: "invalid_client_id",
        message: "Client ID inválido — deve terminar em .apps.googleusercontent.com",
      });
    }
    if (!cfg.clientSecret.startsWith("GOCSPX-") && !cfg.clientSecret.startsWith("GOCP-")) {
      return res.status(400).json({
        error: "invalid_client_secret",
        message: "Client Secret inválido — deve começar com GOCSPX-",
      });
    }

    /* Send a dummy token exchange to Google to verify the client credentials.
       We expect:  invalid_grant  → credentials recognised (good)
                   invalid_client → wrong client_id/secret (bad)           */
    const resp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code:          "dummy_test_code",
        client_id:     cfg.clientId,
        client_secret: cfg.clientSecret,
        redirect_uri:  "https://localhost",
        grant_type:    "authorization_code",
      }),
    });

    const body = await resp.json().catch(() => ({})) as any;
    const errCode = body?.error;

    if (errCode === "invalid_client") {
      return res.status(400).json({
        error: "invalid_client",
        message: "Client ID ou Client Secret inválidos — o Google rejeitou as credenciais.",
      });
    }

    /* invalid_grant / redirect_uri_mismatch → credentials are valid, just wrong code/uri (expected) */
    res.json({ ok: true, message: "Credenciais reconhecidas pelo Google." });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

router.put("/google-oauth", requireAdminFull, async (req: any, res: any) => {
  try {
    const { clientId, clientSecret, enabled } = req.body ?? {};
    const now = Date.now();

    const row = await db.select().from(adminSettingsTable).where(eq(adminSettingsTable.key, "auth.google")).get();
    let current: any = {};
    try { current = row ? JSON.parse(row.value) : {}; } catch { current = {}; }

    const merged = {
      clientId:     (typeof clientId     === "string" && clientId.trim())     ? clientId.trim()     : (current.clientId ?? ""),
      clientSecret: (typeof clientSecret === "string" && clientSecret.trim()) ? clientSecret.trim() : (current.clientSecret ?? ""),
      enabled:      typeof enabled === "boolean" ? enabled : (current.enabled ?? false),
    };

    if (row) {
      await db.update(adminSettingsTable).set({ value: JSON.stringify(merged), updatedAt: now }).where(eq(adminSettingsTable.key, "auth.google"));
    } else {
      await db.insert(adminSettingsTable).values({ key: "auth.google", value: JSON.stringify(merged), updatedAt: now });
    }

    res.json({ ok: true, configured: !!(merged.clientId && merged.clientSecret), enabled: merged.enabled });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/* ---------------------------------------------------------------------------
 * Social media links — GET / PUT /admin/social-config
 * Stored in admin_settings key "social.config"
 * ------------------------------------------------------------------------- */
const SOCIAL_DEFAULTS = { youtube: "", instagram: "", tiktok: "", x: "", facebook: "" };

router.get("/social-config", async (req: any, res: any) => {
  try {
    const cfg = await getSetting("social.config", SOCIAL_DEFAULTS);
    res.json({ ...SOCIAL_DEFAULTS, ...cfg });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

router.put("/social-config", requireAdminFull, async (req: any, res: any) => {
  try {
    const { youtube, instagram, tiktok, x, facebook } = req.body ?? {};
    const current = await getSetting("social.config", SOCIAL_DEFAULTS);
    const merged = {
      youtube:   typeof youtube   === "string" ? youtube.trim()   : current.youtube,
      instagram: typeof instagram === "string" ? instagram.trim() : current.instagram,
      tiktok:    typeof tiktok    === "string" ? tiktok.trim()    : current.tiktok,
      x:         typeof x         === "string" ? x.trim()         : current.x,
      facebook:  typeof facebook  === "string" ? facebook.trim()  : current.facebook,
    };
    await setSetting("social.config", merged);
    res.json({ ok: true, config: merged });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

router.get("/seo-config", async (req: any, res: any) => {
  try {
    const row = await db.select().from(adminSettingsTable).where(eq(adminSettingsTable.key, "seo.config")).get();
    let cfg: any = {};
    try { cfg = row ? JSON.parse(row.value) : {}; } catch { cfg = {}; }
    res.json({ ...SEO_DEFAULTS, ...cfg });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

router.put("/seo-config", requireAdminFull, async (req: any, res: any) => {
  try {
    const { siteName, shortName, domain, description, twitterHandle, themeColor, priceAoa, geo, geoCity } = req.body ?? {};
    const now = Date.now();

    const existing = await db.select().from(adminSettingsTable).where(eq(adminSettingsTable.key, "seo.config")).get();
    let current: any = {};
    try { current = existing ? JSON.parse(existing.value) : {}; } catch { current = {}; }

    const merged = {
      siteName:      siteName      ?? current.siteName      ?? SEO_DEFAULTS.siteName,
      shortName:     shortName     ?? current.shortName     ?? SEO_DEFAULTS.shortName,
      domain:        domain        ?? current.domain        ?? SEO_DEFAULTS.domain,
      description:   description   ?? current.description   ?? SEO_DEFAULTS.description,
      twitterHandle: twitterHandle ?? current.twitterHandle ?? SEO_DEFAULTS.twitterHandle,
      themeColor:    themeColor    ?? current.themeColor    ?? SEO_DEFAULTS.themeColor,
      priceAoa:      priceAoa      ?? current.priceAoa      ?? SEO_DEFAULTS.priceAoa,
      geo:           geo           ?? current.geo           ?? SEO_DEFAULTS.geo,
      geoCity:       geoCity       ?? current.geoCity       ?? SEO_DEFAULTS.geoCity,
    };

    if (existing) {
      await db.update(adminSettingsTable).set({ value: JSON.stringify(merged), updatedAt: now }).where(eq(adminSettingsTable.key, "seo.config"));
    } else {
      await db.insert(adminSettingsTable).values({ key: "seo.config", value: JSON.stringify(merged), updatedAt: now });
    }

    res.json({ ok: true, config: merged });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/* ---------------------------------------------------------------------------
 * Professor activity logs
 * GET  /admin/professor-logs         — lista paginada (master + administrador)
 * DELETE /admin/professor-logs/purge — purga logs com mais de 60 dias
 * ------------------------------------------------------------------------- */
router.get("/professor-logs", requireAdminFull, async (req: any, res: any) => {
  try {
    const page   = Math.max(1, Number(req.query.page  ?? 1));
    const limit  = Math.min(100, Math.max(1, Number(req.query.limit ?? 50)));
    const offset = (page - 1) * limit;

    const all: any[] = await db
      .select()
      .from(professorLogsTable)
      .orderBy(desc(professorLogsTable.createdAt))
      .all();

    let rows = all;
    const { professorEmail, action, resourceType } = req.query;
    if (professorEmail) {
      const q = String(professorEmail).toLowerCase();
      rows = rows.filter((r: any) => r.professorEmail.toLowerCase().includes(q));
    }
    if (action)       rows = rows.filter((r: any) => r.action       === String(action));
    if (resourceType) rows = rows.filter((r: any) => r.resourceType === String(resourceType));

    const total = rows.length;
    const pages = Math.max(1, Math.ceil(total / limit));

    res.json({ logs: rows.slice(offset, offset + limit), total, pages, page, limit });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

router.delete("/professor-logs/purge", requireAdminFull, async (req: any, res: any) => {
  try {
    const cutoff = Date.now() - 60 * 24 * 60 * 60 * 1000; // 60 dias
    const toDelete: any[] = await db
      .select({ id: professorLogsTable.id })
      .from(professorLogsTable)
      .where(sql`${professorLogsTable.createdAt} < ${cutoff}`)
      .all();
    if (toDelete.length > 0) {
      await db
        .delete(professorLogsTable)
        .where(sql`${professorLogsTable.createdAt} < ${cutoff}`);
    }
    res.json({ ok: true, deleted: toDelete.length });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/* ── Auto-purga diária: elimina logs com mais de 60 dias ─────────────────── */
setInterval(async () => {
  const cutoff = Date.now() - 60 * 24 * 60 * 60 * 1000;
  try {
    await db
      .delete(professorLogsTable)
      .where(sql`${professorLogsTable.createdAt} < ${cutoff}`);
  } catch { /* best-effort */ }
}, 24 * 60 * 60 * 1000); // cada 24 h

export default router;

