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
import { plansAdminRouter, plansUserRouter } from "./plans.js";
import contentRouter from "./content.js";
import { requireAuth, requireEmailVerified } from "../middlewares/auth.js";
import {
  db, asc, desc, eq, and, gt, sql,
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
  subscriptionsTable,
  aiUsageTable,
  plansTable,
} from "@workspace/db";

const router = Router();

router.use(healthRouter);
router.use("/auth",          authRouter);
router.use("/progress",      requireAuth, requireEmailVerified, progressRouter);
router.use("/trades",        requireAuth, requireEmailVerified, tradesRouter);
router.use("/notifications", requireAuth, requireEmailVerified, notificationsRouter);
router.use("/duelos",        requireAuth, requireEmailVerified, duelosRouter);
router.use("/admin",         adminRouter);
router.use("/admin/plans",   requireAuth, requireEmailVerified, plansAdminRouter);
router.use("/plans",         requireAuth, requireEmailVerified, plansUserRouter);
router.use("/content",       requireAuth, requireEmailVerified, contentRouter);
router.use("/subscription",  requireAuth, requireEmailVerified, subscriptionsRouter);

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

/* ── Bank config — authenticated (alunos logged-in) ─────────────────── */
router.get("/bank-config", requireAuth, async (_req: any, res: any) => {
  try {
    const row = await db.select().from(adminSettingsTable).where(eq(adminSettingsTable.key, "bank.config")).get();
    let cfg: any = {};
    try { cfg = row ? JSON.parse(row.value) : {}; } catch { cfg = {}; }
    const defaults = { banco: "Banco BFA", conta: "", titular: "", iban: "", descricao: "Mensalidade ALUKA" };
    res.json({ ...defaults, ...cfg });
  } catch {
    res.json({ banco: "Banco BFA", conta: "", titular: "", iban: "", descricao: "Mensalidade ALUKA" });
  }
});

/* ── Public plan config — lê da tabela plans (plano pago activo mais barato) */
router.get("/plan-config", async (_req: any, res: any) => {
  try {
    const paidPlan = await db
      .select({ priceAoa: plansTable.priceAoa, name: plansTable.name })
      .from(plansTable)
      .where(and(eq(plansTable.isActive, 1), eq(plansTable.isDefault, 0)))
      .orderBy(asc(plansTable.priceAoa))
      .limit(1)
      .get();
    if (paidPlan) {
      res.json({ priceAoa: paidPlan.priceAoa, planName: paidPlan.name });
    } else {
      // fallback: legado admin_settings
      const row = await db.select().from(adminSettingsTable).where(eq(adminSettingsTable.key, "plan.config")).get();
      const cfg = row ? (() => { try { return JSON.parse(row.value); } catch { return {}; } })() : {};
      res.json({ priceAoa: cfg.priceAoa ?? 15000, planName: cfg.planName ?? "Plano Mensal" });
    }
  } catch {
    res.json({ priceAoa: 15000, planName: "Plano Mensal" });
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
  priceAoa:      15000,
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

/* ── Aluka IA — helpers ─────────────────────────────────────────────────── */

type AiCfgI = {
  geminiTextKey: string;  geminiTextEnabled: boolean;
  geminiImageKey: string; geminiImageEnabled: boolean;
};
const AI_DEFAULTS: AiCfgI = {
  geminiTextKey: "", geminiTextEnabled: false,
  geminiImageKey: "", geminiImageEnabled: false,
};

async function getAiCfg(): Promise<AiCfgI> {
  const rows = await db.select().from(adminSettingsTable).where(eq(adminSettingsTable.key, "ai.config"));
  return rows[0]?.value ? { ...AI_DEFAULTS, ...(JSON.parse(rows[0].value) as Partial<AiCfgI>) } : AI_DEFAULTS;
}

async function callGemini(apiKey: string, parts: unknown[]): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { maxOutputTokens: 500, temperature: 0.7 },
      }),
    },
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as any;
    const msg: string = body?.error?.message ?? "Erro ao contactar o Gemini.";
    const err = new Error(msg) as any;
    err.status = res.status;
    err.isQuotaError = res.status === 429 || msg.includes("quota") || msg.includes("Quota") || msg.includes("RESOURCE_EXHAUSTED");
    throw err;
  }
  const data = await res.json() as any;
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

/* ── Aluka IA — helpers de limite de uso ──────────────────────────────── */

const AI_FREE_LIMIT_CHART = 1; // usos gratuitos para análise de gráfico
const AI_FREE_LIMIT_TRADE = 1; // usos gratuitos para feedback de trade

async function getUserAiUsage(userId: string) {
  const [row] = await db.select().from(aiUsageTable).where(eq(aiUsageTable.userId, userId));
  return row ?? null;
}

async function isUserPremium(userId: string): Promise<boolean> {
  const now = Date.now();
  const [sub] = await db.select().from(subscriptionsTable).where(
    and(
      eq(subscriptionsTable.userId, userId),
      eq(subscriptionsTable.status, "active"),
      gt(subscriptionsTable.expiresAt, now),
    )
  );
  return !!sub;
}

type AiFeatureType = "chart" | "trade";

async function checkAndIncrementAiUsage(
  userId: string,
  type: AiFeatureType,
): Promise<{ allowed: boolean; isPremium: boolean; usageCount: number }> {
  const premium = await isUserPremium(userId);
  if (premium) return { allowed: true, isPremium: true, usageCount: 0 };

  const usage  = await getUserAiUsage(userId);
  const now    = Date.now();

  if (type === "chart") {
    const count = usage?.chartAnalysisCount ?? 0;
    if (count >= AI_FREE_LIMIT_CHART) return { allowed: false, isPremium: false, usageCount: count };
    if (!usage) {
      await db.insert(aiUsageTable).values({ userId, usageCount: 1, chartAnalysisCount: 1, tradeFeedbackCount: 0, lastUsedAt: now });
    } else {
      await db.update(aiUsageTable)
        .set({ chartAnalysisCount: count + 1, lastUsedAt: now })
        .where(eq(aiUsageTable.userId, userId));
    }
    return { allowed: true, isPremium: false, usageCount: count + 1 };
  } else {
    const count = usage?.tradeFeedbackCount ?? 0;
    if (count >= AI_FREE_LIMIT_TRADE) return { allowed: false, isPremium: false, usageCount: count };
    if (!usage) {
      await db.insert(aiUsageTable).values({ userId, usageCount: 1, chartAnalysisCount: 0, tradeFeedbackCount: 1, lastUsedAt: now });
    } else {
      await db.update(aiUsageTable)
        .set({ tradeFeedbackCount: count + 1, lastUsedAt: now })
        .where(eq(aiUsageTable.userId, userId));
    }
    return { allowed: true, isPremium: false, usageCount: count + 1 };
  }
}

/* ── GET /ai/usage — estado de uso do utilizador ─────────────────────── */

router.get("/ai/usage", requireAuth, requireEmailVerified, async (req: any, res: any) => {
  try {
    const userId  = req.userId as string;
    const premium = await isUserPremium(userId);
    const usage   = await getUserAiUsage(userId);
    res.json({
      isPremium:          premium,
      // Per-type counters
      chartAnalysisCount: usage?.chartAnalysisCount  ?? 0,
      tradeFeedbackCount: usage?.tradeFeedbackCount  ?? 0,
      chartAnalysisLimit: AI_FREE_LIMIT_CHART,
      tradeFeedbackLimit: AI_FREE_LIMIT_TRADE,
      // Legacy field — sum of both for backward compat
      usageCount: (usage?.chartAnalysisCount ?? 0) + (usage?.tradeFeedbackCount ?? 0),
      freeLimit:  AI_FREE_LIMIT_CHART + AI_FREE_LIMIT_TRADE,
    });
  } catch (err: any) {
    res.status(500).json({ error: "internal" });
  }
});

/* ── Aluka IA — análise de gráfico ─────────────────────────────────────── */

router.post("/ai/chart-analysis", requireAuth, requireEmailVerified, async (req: any, res: any) => {
  try {
    const userId = req.userId as string;
    const limit  = await checkAndIncrementAiUsage(userId, "chart");
    if (!limit.allowed) {
      return res.status(403).json({ error: "ai_limit_exceeded", message: "Limite gratuito atingido. Torna-te Premium para acesso ilimitado." });
    }

    const cfg = await getAiCfg();
    const { symbol, timeframe, chartType, currentPrice, lastCandles,
            showRsi, rsiValue, rsiPeriod, showMacd, macdValue, signalValue,
            imageBase64 } = req.body as any;

    /* Validate imageBase64 before use: must be valid base64 and within size limits */
    if (imageBase64 !== undefined && imageBase64 !== null) {
      if (
        typeof imageBase64 !== "string" ||
        imageBase64.length > 350_000 ||
        !/^[A-Za-z0-9+/]={0,2}$/.test(imageBase64.slice(-4)) ||
        !/^[A-Za-z0-9+/=]+$/.test(imageBase64)
      ) {
        return res.status(400).json({ error: "invalid_image", message: "Imagem inválida ou demasiado grande." });
      }
    }
    const hasImage = !!imageBase64 && cfg.geminiImageEnabled && !!cfg.geminiImageKey;
    const hasText  = cfg.geminiTextEnabled && !!cfg.geminiTextKey;

    if (!hasImage && !hasText) {
      return res.status(503).json({ error: "no_key", message: "Aluka IA não configurado pelo administrador." });
    }

    const apiKey = hasImage ? cfg.geminiImageKey : cfg.geminiTextKey;

    const candleSummary = Array.isArray(lastCandles) && lastCandles.length > 0
      ? lastCandles.slice(-5).map((c: any) =>
          `O:${Number(c.open).toFixed(4)} H:${Number(c.high).toFixed(4)} L:${Number(c.low).toFixed(4)} C:${Number(c.close).toFixed(4)}`
        ).join(" | ")
      : "N/A";

    const textContent = [
      `És o ALUKA — coach de trading para iniciantes no mercado lusófono.

Analisa este gráfico financeiro como se estivesses a explicar a um amigo que nunca viu um gráfico na vida.

ESTRUTURA DA RESPOSTA:

1. O QUE ESTÁ A ACONTECER 📊
   Descreve a tendência em 1 frase simples.
   Ex: "O preço está a subir nos últimos períodos."

2. PADRÃO IMPORTANTE 🔍
   Identifica o padrão mais relevante visível.
   Explica o que significa em linguagem simples.

3. OPORTUNIDADE OU RISCO ⚡
   Há sinal de entrada? Ou é melhor esperar?
   Explica porquê em linguagem simples.

4. ONDE PROTEGER O DINHEIRO 🛡️
   Sugere onde colocar o limite de perda máxima e explica porquê esse nível faz sentido.

REGRAS:
- Máximo 120 palavras no total
- Nunca uses termos técnicos sem explicar
- Se o gráfico não tiver sinal claro, diz isso honestamente
- Lembra sempre que isto é simulação educativa, não conselho financeiro real`,
      "",
      `Instrumento: ${symbol ?? "N/A"}`,
      `Timeframe: ${timeframe ?? "N/A"}`,
      `Tipo de gráfico: ${chartType ?? "N/A"}`,
      `Preço atual: ${currentPrice ?? "N/A"}`,
      `Últimas 5 velas (O H L C): ${candleSummary}`,
      showRsi  ? `RSI(${rsiPeriod ?? 14}): ${rsiValue   != null ? Number(rsiValue).toFixed(2)   : "N/A"}` : null,
      showMacd ? `MACD: ${macdValue != null ? Number(macdValue).toFixed(5) : "N/A"}, Sinal: ${signalValue != null ? Number(signalValue).toFixed(5) : "N/A"}` : null,
    ].filter(Boolean).join("\n");

    const parts: unknown[] = hasImage
      ? [{ inline_data: { mime_type: "image/png", data: imageBase64 } }, { text: textContent }]
      : [{ text: textContent }];

    const analysis = await callGemini(apiKey, parts);
    res.json({ ok: true, analysis });
  } catch (err: any) {
    req.log?.error(err);
    if (err?.isQuotaError) return res.status(429).json({ error: "quota_exceeded", message: "Limite de pedidos à IA atingido. Tenta novamente em alguns segundos." });
    res.status(500).json({ error: "internal", message: "Erro interno ao contactar a IA." });
  }
});

/* ── Aluka IA — feedback de trade ──────────────────────────────────────── */

router.post("/ai/trade-feedback", requireAuth, requireEmailVerified, async (req: any, res: any) => {
  try {
    const userId = req.userId as string;
    const limit  = await checkAndIncrementAiUsage(userId, "trade");
    if (!limit.allowed) {
      return res.status(403).json({ error: "ai_limit_exceeded", message: "Limite gratuito atingido. Torna-te Premium para acesso ilimitado." });
    }

    const cfg = await getAiCfg();
    if (!cfg.geminiTextEnabled || !cfg.geminiTextKey) {
      return res.status(503).json({ error: "no_key" });
    }

    const trade = req.body as any;
    const prompt = `És o ALUKA — um coach de trading experiente e paciente, criado para ensinar iniciantes no mercado angolano e lusófono. O teu objectivo não é impressionar com termos técnicos — é fazer o aluno APRENDER com cada trade.

PERSONALIDADE:
- Fala em português simples e directo
- Sê encorajador mesmo quando o trade foi mau
- Nunca uses jargão sem explicar o que significa
- Trata o aluno como um amigo inteligente que está a aprender, não como um especialista

ESTRUTURA DA RESPOSTA — segue sempre esta ordem:

1. RESULTADO (1 linha)
   Resume o trade em uma frase simples.
   Ex: "Fizeste uma compra de BTC/USD e saíste com lucro de $340 em 14 minutos."

2. O QUE FIZESTE BEM ✅
   Identifica 1 ou 2 coisas positivas no trade.
   Se não houver nada positivo, encontra pelo menos a intenção certa.

3. O QUE PODES MELHORAR ⚠️
   Máximo 2 pontos. Sê específico mas gentil.
   Explica PORQUÊ é importante melhorar isso.

4. LIÇÃO DO DIA 💡
   Uma única lição clara que o aluno leva deste trade.
   Deve ser memorável e aplicável no próximo trade.

5. PRÓXIMO PASSO 🎯
   Uma acção concreta que o aluno deve fazer no próximo trade para melhorar.

REGRAS IMPORTANTES:
- Máximo 150 palavras no total
- Nunca digas "stop loss" sem explicar que é o limite de perda máxima
- Se o aluno perdeu dinheiro, começa sempre pelo lado positivo
- Termina sempre com uma frase motivadora curta

Dados do trade a analisar:
${JSON.stringify(trade, null, 2)}`;

    const analysis = await callGemini(cfg.geminiTextKey, [{ text: prompt }]);
    res.json({ ok: true, analysis });
  } catch (err: any) {
    req.log?.error(err);
    if (err?.isQuotaError) return res.status(429).json({ error: "quota_exceeded", message: "Limite de pedidos à IA atingido. Tenta novamente em alguns segundos." });
    res.status(500).json({ error: "internal", message: "Erro interno ao contactar a IA." });
  }
});

export default router;
