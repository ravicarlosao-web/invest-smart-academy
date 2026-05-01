// @ts-nocheck
import { Router } from "express";
import healthRouter        from "./health.js";
import authRouter          from "./auth.js";
import progressRouter      from "./progress.js";
import tradesRouter        from "./trades.js";
import notificationsRouter from "./notifications.js";
import duelosRouter        from "./duelos.js";
import adminRouter         from "./admin.js";
import subscriptionsRouter from "./subscriptions.js";
import { requireAuth }     from "../middlewares/auth.js";
import {
  db, asc, desc, eq,
  glossaryTermsTable,
  strategiesTable,
  booksTable,
  resourceSectionsTable,
  resourceItemsTable,
  curriculumLevelsTable,
  curriculumLessonsTable,
  adminSettingsTable,
  usersTable,
  progressTable,
} from "@workspace/db";

const router = Router();

router.use(healthRouter);
router.use("/auth",          authRouter);
router.use("/progress",      requireAuth, progressRouter);
router.use("/trades",        requireAuth, tradesRouter);
router.use("/notifications", requireAuth, notificationsRouter);
router.use("/duelos",        requireAuth, duelosRouter);
router.use("/admin",         adminRouter);
router.use("/subscription",  requireAuth, subscriptionsRouter);

/* ── Public content routes — no auth required ─────────────────────────── */

router.get("/videos", async (_req: any, res: any) => {
  try {
    const row = await db.select().from(adminSettingsTable).where(eq(adminSettingsTable.key, "content.videos")).get();
    const videos = row ? (() => { try { return JSON.parse(row.value); } catch { return []; } })() : [];
    res.json(videos);
  } catch {
    res.json([]);
  }
});

router.get("/glossary", async (_req: any, res: any) => {
  try {
    const rows = await db
      .select()
      .from(glossaryTermsTable)
      .orderBy(asc(glossaryTermsTable.sortOrder));
    res.json(
      rows.map((r: any) => ({
        term:       r.term,
        definition: r.definition,
        category:   r.category,
      })),
    );
  } catch {
    res.json([]);
  }
});

router.get("/strategies", async (_req: any, res: any) => {
  try {
    const rows = await db
      .select()
      .from(strategiesTable)
      .orderBy(asc(strategiesTable.sortOrder));
    res.json(
      rows.map((r: any) => ({
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
      })),
    );
  } catch {
    res.json([]);
  }
});

router.get("/books", async (_req: any, res: any) => {
  try {
    const rows = await db
      .select()
      .from(booksTable)
      .orderBy(asc(booksTable.orderNum));
    res.json(
      rows.map((r: any) => ({
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
      })),
    );
  } catch {
    res.json([]);
  }
});

router.get("/resources", async (_req: any, res: any) => {
  try {
    const sections = await db
      .select()
      .from(resourceSectionsTable)
      .orderBy(asc(resourceSectionsTable.sortOrder));

    const items = await db
      .select()
      .from(resourceItemsTable)
      .orderBy(asc(resourceItemsTable.sortOrder));

    const result = sections.map((s: any) => ({
      id:    s.id,
      title: s.title,
      icon:  s.icon,
      color: s.color,
      items: items
        .filter((it: any) => it.sectionId === s.id)
        .map((it: any) => ({
          name:        it.name,
          description: it.description,
          url:         it.url   ?? undefined,
          badge:       it.badge ?? undefined,
          stars:       it.stars ?? undefined,
          tags:        jsonParse(it.tags, []),
        })),
    }));
    res.json(result);
  } catch {
    res.json([]);
  }
});

router.get("/curriculum", async (_req: any, res: any) => {
  try {
    const levels = await db
      .select()
      .from(curriculumLevelsTable)
      .orderBy(asc(curriculumLevelsTable.sortOrder));

    const lessons = await db
      .select()
      .from(curriculumLessonsTable)
      .orderBy(asc(curriculumLessonsTable.sortOrder));

    /* Load admin overrides (title / xp / summary / hidden per lesson ID) */
    const overrideRow = await db.select().from(adminSettingsTable)
      .where(eq(adminSettingsTable.key, "curriculum.override")).get();
    const overrides: Record<string, { title?: string; xp?: number; summary?: string; hidden?: boolean }> =
      overrideRow ? (() => { try { return (JSON.parse(overrideRow.value) as any).lessons ?? {}; } catch { return {}; } })() : {};

    const result = levels.map((lv: any) => ({
      id:         lv.id,
      title:      lv.title,
      subtitle:   lv.subtitle,
      difficulty: lv.difficulty,
      lessons: lessons
        .filter((ls: any) => ls.levelId === lv.id)
        .filter((ls: any) => !overrides[ls.id]?.hidden)
        .map((ls: any) => {
          const ov = overrides[ls.id] ?? {};
          return {
            id:        ls.id,
            title:     ov.title   ?? ls.title,
            summary:   ov.summary ?? ls.summary,
            xp:        ov.xp      ?? ls.xp,
            content:   jsonParse(ls.content, []),
            questions: jsonParse(ls.questions, []),
          };
        }),
    }));
    res.json(result);
  } catch {
    res.json([]);
  }
});

/* ── Public plan config — price shown on landing page ────────────────── */
router.get("/plan-config", async (_req: any, res: any) => {
  try {
    const row = await db.select().from(adminSettingsTable).where(eq(adminSettingsTable.key, "plan.config")).get();
    const cfg = row ? (() => { try { return JSON.parse(row.value); } catch { return {}; } })() : {};
    res.json({ priceAoa: cfg.priceAoa ?? 5000, planName: cfg.planName ?? "Plano Mensal" });
  } catch {
    res.json({ priceAoa: 5000, planName: "Plano Mensal" });
  }
});

/* ── Public leaderboard — top 20 users by XP ─────────────────────────── */
router.get("/leaderboard", async (_req: any, res: any) => {
  try {
    const rows = await db
      .select({
        userId: progressTable.userId,
        xp:     progressTable.xp,
        name:   usersTable.name,
        email:  usersTable.email,
      })
      .from(progressTable)
      .innerJoin(usersTable, eq(progressTable.userId, usersTable.id))
      .orderBy(desc(progressTable.xp))
      .limit(20)
      .all();

    res.json(
      rows.map((r: any, i: number) => ({
        rank:   i + 1,
        userId: r.userId,
        name:   r.name ?? r.email?.split("@")[0] ?? "Utilizador",
        xp:     r.xp ?? 0,
      })),
    );
  } catch {
    res.json([]);
  }
});

function jsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default router;
