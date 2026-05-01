// @ts-nocheck
import { Router, type Request, type Response, type NextFunction } from "express";
import { timingSafeEqual } from "node:crypto";
import {
  db,
  usersTable,
  progressTable,
  tradesTable,
  notificationsTable,
  duelosTable,
  adminSettingsTable,
  subscriptionsTable,
  strategiesTable,
  glossaryTermsTable,
  booksTable,
  resourceSectionsTable,
  resourceItemsTable,
  curriculumLevelsTable,
  curriculumLessonsTable,
  eq,
  desc,
  asc,
  and,
  sql,
} from "@workspace/db";

const router = Router();

import { createHash } from "node:crypto";
import { AdminLoginBody, AdminRejectBody, AdminXpBody } from "@workspace/api-zod";
import { sendSubscriptionApprovalEmail, sendSubscriptionRejectionEmail, sendTestEmail } from "../lib/email.js";
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

const ADMIN_PASSWORD = process.env["ADMIN_PASSWORD"];
if (!ADMIN_PASSWORD) {
  throw new Error("ADMIN_PASSWORD environment variable is required");
}
const ADMIN_TOKEN    = createHash("sha256").update(ADMIN_PASSWORD).digest("hex");
const ADMIN_TOKEN_BUF = Buffer.from(ADMIN_TOKEN, "utf8");

/* ── Protecção de força bruta ─────────────────────────────────────────────
 * Máx 5 tentativas falhadas por IP → bloqueio de 30 minutos.
 * Mapa limpo automaticamente para não acumular memória.
 * ---------------------------------------------------------------------- */
const MAX_ATTEMPTS   = 5;
const LOCKOUT_MS     = 30 * 60 * 1000; // 30 minutos
const CLEANUP_MS     = 60 * 60 * 1000; // limpeza a cada 1h

interface LoginAttempt { count: number; lockedUntil: number | null; lastAttempt: number; }
const loginAttempts = new Map<string, LoginAttempt>();

setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of loginAttempts) {
    if (now - data.lastAttempt > CLEANUP_MS) loginAttempts.delete(ip);
  }
}, CLEANUP_MS);

function getIp(req: Request): string {
  return String(req.headers["x-forwarded-for"] ?? req.socket.remoteAddress ?? "unknown").split(",")[0].trim();
}

function isLocked(ip: string): boolean {
  const data = loginAttempts.get(ip);
  if (!data) return false;
  if (data.lockedUntil && Date.now() < data.lockedUntil) return true;
  if (data.lockedUntil && Date.now() >= data.lockedUntil) {
    loginAttempts.delete(ip);
  }
  return false;
}

function recordFailure(ip: string): { attempts: number; locked: boolean } {
  const data = loginAttempts.get(ip) ?? { count: 0, lockedUntil: null, lastAttempt: 0 };
  data.count++;
  data.lastAttempt = Date.now();
  if (data.count >= MAX_ATTEMPTS) {
    data.lockedUntil = Date.now() + LOCKOUT_MS;
  }
  loginAttempts.set(ip, data);
  return { attempts: data.count, locked: data.lockedUntil != null };
}

function resetAttempts(ip: string) { loginAttempts.delete(ip); }

function safeTokenCompare(candidate: string): boolean {
  try {
    const candidateBuf = Buffer.alloc(ADMIN_TOKEN_BUF.length);
    Buffer.from(candidate, "utf8").copy(candidateBuf);
    return timingSafeEqual(candidateBuf, ADMIN_TOKEN_BUF);
  } catch {
    return false;
  }
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = String(req.header("x-admin-token") ?? "");
  if (!token || !safeTokenCompare(token)) {
    return res.status(401).json({ error: "unauthorized" });
  }
  next();
}

/* POST /api/admin/login */
router.post("/login", validate(AdminLoginBody), (req: any, res: any) => {
  const ip = getIp(req);

  if (isLocked(ip)) {
    const data = loginAttempts.get(ip);
    const minutesLeft = data?.lockedUntil ? Math.ceil((data.lockedUntil - Date.now()) / 60000) : 30;
    return res.status(429).json({
      error: "too_many_attempts",
      message: `Acesso bloqueado. Tenta novamente em ${minutesLeft} minuto(s).`,
    });
  }

  const { passwordHash } = req.body as { passwordHash: string };
  if (!safeTokenCompare(passwordHash)) {
    const { attempts, locked } = recordFailure(ip);
    const remaining = MAX_ATTEMPTS - attempts;
    return res.status(401).json({
      error: "invalid_password",
      message: locked
        ? `Acesso bloqueado por 30 minutos após ${MAX_ATTEMPTS} tentativas.`
        : `Senha incorrecta. ${remaining > 0 ? `${remaining} tentativa(s) restante(s).` : ""}`,
    });
  }

  resetAttempts(ip);
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
router.get("/overview", async (req: any, res: any) => {
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
router.get("/users", async (req: any, res: any) => {
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

router.delete("/users/:userId", async (req: any, res: any) => {
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

router.post("/users/:userId/reset-progress", async (req: any, res: any) => {
  try {
    await db.delete(progressTable).where(eq(progressTable.userId, String(req.params.userId)));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

router.post("/users/:userId/reset-sim", async (req: any, res: any) => {
  try {
    await db.delete(tradesTable).where(eq(tradesTable.userId, String(req.params.userId)));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/* Adjust user XP */
router.patch("/users/:userId/xp", validate(AdminXpBody), async (req: any, res: any) => {
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
router.get("/simulator", async (req: any, res: any) => {
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
    res.json({ ok: true, sections: sections.length });
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
    const items = Array.isArray(req.body) ? req.body : [];
    await setSetting("content.videos", items);
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/* ---------------------------------------------------------------------------
 * Subscrições — gestão manual de pagamentos (5.000 AOA/mês)
 * ------------------------------------------------------------------------- */

/** GET /api/admin/subscriptions  — lista todas as subscrições com info do utilizador */
router.get("/subscriptions", async (req: any, res: any) => {
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

    const result = subs
      .filter((s: any) => !status || s.status === status)
      .map((s: any) => {
        const { receiptData: _rd, ...rest } = s;
        return {
          ...rest,
          hasReceipt: !!s.receiptData,
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
router.get("/subscriptions/:id/receipt", async (req: any, res: any) => {
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
router.get("/subscriptions/stats", async (req: any, res: any) => {
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

/** PATCH /api/admin/subscriptions/:id/approve — aprova e ativa por 30 dias */
router.patch("/subscriptions/:id/approve", async (req: any, res: any) => {
  try {
    const now       = Date.now();
    const expiresAt = now + 30 * 24 * 60 * 60 * 1000; // +30 dias

    const sub = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.id, String(req.params.id))).get();
    if (!sub) return res.status(404).json({ error: "not_found" });

    await db.update(subscriptionsTable).set({
      status:     "active",
      approvedAt: now,
      expiresAt,
      updatedAt:  now,
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
router.patch("/subscriptions/:id/reject", validate(AdminRejectBody), async (req: any, res: any) => {
  try {
    const { notes } = req.body;
    const now = Date.now();

    const sub = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.id, String(req.params.id))).get();
    if (!sub) return res.status(404).json({ error: "not_found" });

    await db.update(subscriptionsTable).set({
      status:    "rejected",
      notes:     notes ?? null,
      updatedAt: now,
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
 * ------------------------------------------------------------------------- */
router.get("/plan-config", async (req: any, res: any) => {
  try {
    const cfg = await getSetting<{ priceAoa: number; planName: string }>(
      "plan.config",
      { priceAoa: 5000, planName: "Plano Mensal" },
    );
    res.json(cfg);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

router.put("/plan-config", async (req: any, res: any) => {
  try {
    const { priceAoa, planName } = req.body as { priceAoa?: number; planName?: string };
    if (priceAoa !== undefined && (typeof priceAoa !== "number" || priceAoa <= 0)) {
      return res.status(400).json({ error: "invalid_price" });
    }
    const current = await getSetting<{ priceAoa: number; planName: string }>(
      "plan.config",
      { priceAoa: 5000, planName: "Plano Mensal" },
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
 * Finance Overview — GET /admin/finance
 * Revenue summary combining subscription stats with plan pricing
 * ------------------------------------------------------------------------- */
router.get("/finance", async (req: any, res: any) => {
  try {
    const cfg = await getSetting<{ priceAoa: number; planName: string }>(
      "plan.config",
      { priceAoa: 5000, planName: "Plano Mensal" },
    );

    const subs = await db.select({
      id:        subscriptionsTable.id,
      status:    subscriptionsTable.status,
      amount:    subscriptionsTable.amount,
      createdAt: subscriptionsTable.createdAt,
      expiresAt: subscriptionsTable.expiresAt,
    }).from(subscriptionsTable).all();

    const now = Date.now();
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
 * POST /admin/ai-config/test — validates the stored key against OpenAI API
 * Stores { openaiKey, model } in admin_settings under key "ai.config"
 * The GET endpoint returns the key partially masked for security.
 * ------------------------------------------------------------------------- */
router.get("/ai-config", async (req: any, res: any) => {
  try {
    const cfg = await getSetting<{ openaiKey: string; model: string }>(
      "ai.config",
      { openaiKey: "", model: "gpt-4o-mini" },
    );
    const key = cfg.openaiKey;
    const masked = key.length > 12
      ? key.slice(0, 8) + "•".repeat(Math.min(key.length - 12, 20)) + key.slice(-4)
      : key.length > 0 ? "•".repeat(key.length) : "";
    res.json({ configured: key.length > 0, keyPreview: masked, model: cfg.model });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

router.put("/ai-config", async (req: any, res: any) => {
  try {
    const { openaiKey, model } = req.body as { openaiKey?: string; model?: string };
    const VALID_MODELS = ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"];
    if (model !== undefined && !VALID_MODELS.includes(model)) {
      return res.status(400).json({ error: "invalid_model" });
    }
    const current = await getSetting<{ openaiKey: string; model: string }>(
      "ai.config",
      { openaiKey: "", model: "gpt-4o-mini" },
    );
    const newKey = (openaiKey ?? current.openaiKey).trim();
    await setSetting("ai.config", {
      openaiKey: newKey,
      model: model ?? current.model,
    });
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

router.post("/ai-config/test", async (req: any, res: any) => {
  try {
    const cfg = await getSetting<{ openaiKey: string; model: string }>(
      "ai.config",
      { openaiKey: "", model: "gpt-4o-mini" },
    );
    if (!cfg.openaiKey) {
      return res.status(400).json({ error: "no_key", message: "Nenhuma chave configurada." });
    }
    const testRes = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${cfg.openaiKey}` },
    });
    if (!testRes.ok) {
      const body = await testRes.json().catch(() => ({}));
      return res.status(400).json({
        error: "invalid_key",
        message: body?.error?.message ?? "Chave inválida ou sem permissões.",
      });
    }
    res.json({ ok: true, model: cfg.model });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/* ===========================================================================
 * Email Config — GET / PUT /api/admin/email-config
 * POST /api/admin/email-config/test
 * ========================================================================= */

/** GET /api/admin/email-config — returns config status (never returns key) */
router.get("/email-config", async (req: any, res: any) => {
  try {
    const row = await db.select().from(adminSettingsTable).where(eq(adminSettingsTable.key, "email.config")).get();
    let cfg: any = {};
    try { cfg = row ? JSON.parse(row.value) : {}; } catch { cfg = {}; }
    const envKey = process.env["SENDGRID_API_KEY"];
    res.json({
      configured:     !!(cfg.apiKey || envKey),
      keySource:      cfg.apiKey ? "database" : envKey ? "environment" : "none",
      fromEmail:      cfg.fromEmail ?? "",
      fromName:       cfg.fromName  ?? "TradeAcademy",
      adminEmail:     cfg.adminEmail ?? "",
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/** PUT /api/admin/email-config — saves config (apiKey may be empty to clear) */
router.put("/email-config", async (req: any, res: any) => {
  try {
    const { apiKey, fromEmail, fromName, adminEmail } = req.body ?? {};
    const now = Date.now();

    /* Load existing to preserve key if new one is empty */
    const existing = await db.select().from(adminSettingsTable).where(eq(adminSettingsTable.key, "email.config")).get();
    let current: any = {};
    try { current = existing ? JSON.parse(existing.value) : {}; } catch { current = {}; }

    const merged = {
      apiKey:     apiKey     ?? current.apiKey ?? "",
      fromEmail:  fromEmail  ?? current.fromEmail  ?? "noreply@tradeacademy.ao",
      fromName:   fromName   ?? current.fromName   ?? "TradeAcademy",
      adminEmail: adminEmail ?? current.adminEmail ?? "",
    };

    if (existing) {
      await db.update(adminSettingsTable).set({ value: JSON.stringify(merged), updatedAt: now }).where(eq(adminSettingsTable.key, "email.config"));
    } else {
      await db.insert(adminSettingsTable).values({ key: "email.config", value: JSON.stringify(merged), updatedAt: now });
    }

    res.json({ ok: true, configured: !!merged.apiKey });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/** POST /api/admin/email-config/test — sends test email to adminEmail */
router.post("/email-config/test", async (req: any, res: any) => {
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

export default router;

