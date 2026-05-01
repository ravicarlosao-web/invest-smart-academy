import { Router } from "express";
import healthRouter        from "./health";
import authRouter          from "./auth";
import progressRouter      from "./progress";
import tradesRouter        from "./trades";
import notificationsRouter from "./notifications";
import duelosRouter        from "./duelos";
import adminRouter         from "./admin";
import subscriptionsRouter from "./subscriptions";
import {
  db, asc,
  glossaryTermsTable,
  strategiesTable,
  booksTable,
  resourceSectionsTable,
  resourceItemsTable,
  curriculumLevelsTable,
  curriculumLessonsTable,
  eq,
} from "@workspace/db";

const router = Router();

router.use(healthRouter);
router.use("/auth",          authRouter);
router.use("/progress",      progressRouter);
router.use("/trades",        tradesRouter);
router.use("/notifications", notificationsRouter);
router.use("/duelos",        duelosRouter);
router.use("/admin",         adminRouter);
router.use("/subscription",  subscriptionsRouter);

/* ── Public content routes — no auth required ─────────────────────────── */

router.get("/videos", (_req, res) => {
  res.json([]);
});

router.get("/glossary", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(glossaryTermsTable)
      .orderBy(asc(glossaryTermsTable.sortOrder));
    res.json(
      rows.map((r) => ({
        term:       r.term,
        definition: r.definition,
        category:   r.category,
      })),
    );
  } catch {
    res.json([]);
  }
});

router.get("/strategies", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(strategiesTable)
      .orderBy(asc(strategiesTable.sortOrder));
    res.json(
      rows.map((r) => ({
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

router.get("/books", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(booksTable)
      .orderBy(asc(booksTable.orderNum));
    res.json(
      rows.map((r) => ({
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

router.get("/resources", async (_req, res) => {
  try {
    const sections = await db
      .select()
      .from(resourceSectionsTable)
      .orderBy(asc(resourceSectionsTable.sortOrder));

    const items = await db
      .select()
      .from(resourceItemsTable)
      .orderBy(asc(resourceItemsTable.sortOrder));

    const result = sections.map((s) => ({
      id:    s.id,
      title: s.title,
      icon:  s.icon,
      color: s.color,
      items: items
        .filter((it) => it.sectionId === s.id)
        .map((it) => ({
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

router.get("/curriculum", async (_req, res) => {
  try {
    const levels = await db
      .select()
      .from(curriculumLevelsTable)
      .orderBy(asc(curriculumLevelsTable.sortOrder));

    const lessons = await db
      .select()
      .from(curriculumLessonsTable)
      .orderBy(asc(curriculumLessonsTable.sortOrder));

    const result = levels.map((lv) => ({
      id:         lv.id,
      title:      lv.title,
      subtitle:   lv.subtitle,
      difficulty: lv.difficulty,
      lessons: lessons
        .filter((ls) => ls.levelId === lv.id)
        .map((ls) => ({
          id:        ls.id,
          title:     ls.title,
          summary:   ls.summary,
          xp:        ls.xp,
          content:   jsonParse(ls.content, []),
          questions: jsonParse(ls.questions, []),
        })),
    }));
    res.json(result);
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
