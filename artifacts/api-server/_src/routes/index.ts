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
    const overrides: Record<string, { title?: string; xp?: number; summary?: string; hidden?: boolean; audioUrl?: string; audioEnabled?: boolean }> =
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
            id:           ls.id,
            title:        ov.title        ?? ls.title,
            summary:      ov.summary      ?? ls.summary,
            xp:           ov.xp           ?? ls.xp,
            content:      jsonParse(ls.content, []),
            questions:    jsonParse(ls.questions, []),
            audioUrl:     ov.audioUrl     ?? null,
            audioEnabled: ov.audioEnabled ?? false,
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

/* ── Social media links — public read ────────────────────────────────── */
router.get("/social-config", async (_req: any, res: any) => {
  try {
    const row = await db.select().from(adminSettingsTable).where(eq(adminSettingsTable.key, "social.config")).get();
    let cfg: any = {};
    try { cfg = row ? JSON.parse(row.value) : {}; } catch { cfg = {}; }
    const defaults = { youtube: "", instagram: "", tiktok: "", x: "", facebook: "" };
    res.json({ ...defaults, ...cfg });
  } catch {
    res.json({ youtube: "", instagram: "", tiktok: "", x: "", facebook: "" });
  }
});

/* ── SEO / Site Config — public read ──────────────────────────────────── */
const SEO_DEFAULTS = {
  siteName:      "TradeAcademy Angola",
  shortName:     "TradeAcademy",
  domain:        "",
  description:   "A primeira plataforma angolana de educação em trading. Aulas gratuitas de Forex, acções e cripto, simulador com $10.000 demo, estratégias profissionais. 100% em português.",
  twitterHandle: "@TradeAcademyAO",
  themeColor:    "#06b6d4",
  priceAoa:      5000,
  geo:           "AO",
  geoCity:       "Luanda, Angola",
};

router.get("/site-config", async (_req: any, res: any) => {
  try {
    const row = await db.select().from(adminSettingsTable).where(eq(adminSettingsTable.key, "seo.config")).get();
    let cfg: any = {};
    try { cfg = row ? JSON.parse(row.value) : {}; } catch { cfg = {}; }
    res.json({ ...SEO_DEFAULTS, ...cfg });
  } catch {
    res.json(SEO_DEFAULTS);
  }
});

/* ── Dynamic PWA manifest — always reflects latest seo.config ─────────── */
router.get("/manifest", async (_req: any, res: any) => {
  try {
    const row = await db.select().from(adminSettingsTable).where(eq(adminSettingsTable.key, "seo.config")).get();
    let cfg: any = {};
    try { cfg = row ? JSON.parse(row.value) : {}; } catch { cfg = {}; }
    const c = { ...SEO_DEFAULTS, ...cfg };

    const baseUrl = c.domain ? `https://${c.domain}` : (process.env.APP_URL ?? "");

    const manifest = {
      name:             c.siteName,
      short_name:       c.shortName,
      description:      c.description,
      start_url:        "/",
      id:               baseUrl ? `${baseUrl}/` : "/",
      scope:            "/",
      display:          "standalone",
      display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
      orientation:      "portrait-primary",
      background_color: "#060b17",
      theme_color:      c.themeColor,
      lang:             "pt-AO",
      dir:              "ltr",
      categories:       ["education", "finance"],
      icons: [
        { src: "/pwa-icon-72.png",  sizes: "72x72",   type: "image/png", purpose: "any" },
        { src: "/pwa-icon-96.png",  sizes: "96x96",   type: "image/png", purpose: "any" },
        { src: "/pwa-icon-128.png", sizes: "128x128", type: "image/png", purpose: "any" },
        { src: "/pwa-icon-144.png", sizes: "144x144", type: "image/png", purpose: "any" },
        { src: "/pwa-icon-152.png", sizes: "152x152", type: "image/png", purpose: "any" },
        { src: "/pwa-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
        { src: "/pwa-icon-384.png", sizes: "384x384", type: "image/png", purpose: "any" },
        { src: "/pwa-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
      ],
      screenshots: [
        {
          src: "/opengraph.jpg",
          sizes: "1200x630",
          type: "image/jpeg",
          form_factor: "wide",
          label: `${c.siteName} — Aprenda Trading`,
        },
      ],
      shortcuts: [
        {
          name: "Aprender",
          short_name: "Aulas",
          description: "Continua de onde paraste",
          url: "/aprender",
          icons: [{ src: "/pwa-icon-96.png", sizes: "96x96" }],
        },
        {
          name: "Simulador",
          short_name: "Simular",
          description: "Pratica no simulador",
          url: "/simular",
          icons: [{ src: "/pwa-icon-96.png", sizes: "96x96" }],
        },
      ],
      prefer_related_applications: false,
    };

    res.setHeader("Content-Type", "application/manifest+json");
    res.setHeader("Cache-Control", "no-cache, max-age=0");
    res.json(manifest);
  } catch {
    res.status(500).json({ error: "internal" });
  }
});

export default router;
