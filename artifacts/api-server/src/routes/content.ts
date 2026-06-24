// @ts-nocheck
/**
 * content.ts — Rotas de conteúdo autenticadas
 *
 * Montado em /api/content (ver routes/index.ts).
 * Todas as rotas requerem JWT válido.
 *
 * Regra de transição:
 *   Se um conteúdo NÃO estiver em plan_permissions para NENHUM plano
 *   → acessível para todos (backward compat durante migração).
 *   Só bloqueia quando o admin explicitamente o associa a um plano.
 */
import { Router }   from "express";
import { checkPlanAccess } from "../middlewares/planAccess.js";
import {
  db, eq, and, gt, desc, asc, sql,
  subscriptionsTable,
  plansTable,
  planPermissionsTable,
  curriculumLevelsTable,
  curriculumLessonsTable,
  booksTable,
  strategiesTable,
  resourceSectionsTable,
  resourceItemsTable,
  adminSettingsTable,
  videosTable,
} from "@workspace/db";

const router = Router();

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function jsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

/**
 * Resolve o planId do utilizador:
 *   1. Subscrição activa → planId da sub
 *   2. Sem sub activa → plano default (gratuito)
 */
async function getUserPlanId(userId: string): Promise<string | null> {
  const now = Date.now();

  const activeSub = await db
    .select({ planId: subscriptionsTable.planId })
    .from(subscriptionsTable)
    .where(and(
      eq(subscriptionsTable.userId, userId),
      eq(subscriptionsTable.status, "active"),
      gt(subscriptionsTable.expiresAt, now),
    ))
    .orderBy(desc(subscriptionsTable.createdAt))
    .limit(1)
    .get();

  if (activeSub?.planId) return activeSub.planId;

  const defPlan = await db
    .select({ id: plansTable.id })
    .from(plansTable)
    .where(eq(plansTable.isDefault, 1))
    .limit(1)
    .get();

  return defPlan?.id ?? null;
}

/**
 * Constrói o mapa de acessos para um contentType.
 * Retorna:
 *   gatedIds  — contentIds que estão bloqueados por ALGUM plano
 *   userPerms — contentIds que o utilizador TEM acesso no seu plano
 */
async function buildAccessMap(userId: string, contentType: string) {
  const planId = await getUserPlanId(userId);

  // Tudo o que está gated em qualquer plano (para este contentType)
  const allGated = await db
    .select({ contentId: planPermissionsTable.contentId })
    .from(planPermissionsTable)
    .where(eq(planPermissionsTable.contentType, contentType))
    .all();
  const gatedIds = new Set<string>(allGated.map((p: any) => p.contentId));

  // O que o utilizador tem no seu plano
  const userPerms = new Set<string>();
  if (planId) {
    const myPerms = await db
      .select({ contentId: planPermissionsTable.contentId })
      .from(planPermissionsTable)
      .where(and(
        eq(planPermissionsTable.planId, planId),
        eq(planPermissionsTable.contentType, contentType),
      ))
      .all();
    myPerms.forEach((p: any) => userPerms.add(p.contentId));
  }

  return { gatedIds, userPerms, planId };
}

/**
 * Regra de acesso:
 *   - Não está gated por nenhum plano → true (backward compat)
 *   - Está gated + utilizador tem permissão → true
 *   - Está gated + utilizador não tem → false
 */
function canAccess(id: string, gatedIds: Set<string>, userPerms: Set<string>): boolean {
  if (!gatedIds.has(id)) return true;
  return userPerms.has(id);
}

/* ════════════════════════════════════════════════════════════════════════════
 * GET /api/content/curriculum
 * Lista de níveis + lições com campo accessible por lição.
 * ════════════════════════════════════════════════════════════════════════════ */
router.get("/curriculum", async (req: any, res: any) => {
  try {
    const userId = req.userId as string;

    const [levels, lessons] = await Promise.all([
      db.select().from(curriculumLevelsTable).orderBy(asc(curriculumLevelsTable.sortOrder)).all(),
      db.select().from(curriculumLessonsTable).orderBy(asc(curriculumLessonsTable.sortOrder)).all(),
    ]);

    // Overrides de admin (título, xp, summary, hidden, audio)
    const overrideRow = await db.select().from(adminSettingsTable)
      .where(eq(adminSettingsTable.key, "curriculum.override")).get();
    const overrides: Record<string, any> = overrideRow
      ? (() => { try { return (JSON.parse(overrideRow.value) as any).lessons ?? {}; } catch { return {}; } })()
      : {};

    // Mapas de acesso para lições e níveis
    const [lessonMap, levelMap] = await Promise.all([
      buildAccessMap(userId, "lesson"),
      buildAccessMap(userId, "level"),
    ]);

    const result = levels.map((lv: any) => {
      // Nível acessível directamente (gated por "level" permission ou não gated)
      const levelAccessible = canAccess(String(lv.id), levelMap.gatedIds, levelMap.userPerms);
      // O utilizador tem permissão explícita de nível → desbloqueia todas as lições do nível
      const levelUnlockedByPermission = levelMap.userPerms.has(String(lv.id));

      return {
        id:         lv.id,
        title:      lv.title,
        subtitle:   lv.subtitle,
        difficulty: lv.difficulty,
        accessible: levelAccessible,
        lessons: lessons
          .filter((ls: any) => ls.levelId === lv.id)
          .filter((ls: any) => !overrides[ls.id]?.hidden)
          .map((ls: any) => {
            const ov = overrides[ls.id] ?? {};
            // Acessível se a lição directamente o permite OU o utilizador tem permissão explícita do nível
            // Nota: levelAccessible=true quando o nível NÃO está gated — mas isso não deve desbloquear lições gated
            const accessible = canAccess(ls.id, lessonMap.gatedIds, lessonMap.userPerms) || levelUnlockedByPermission;
            return {
              id:           ls.id,
              title:        ov.title        ?? ls.title,
              summary:      ov.summary      ?? ls.summary,
              xp:           ov.xp           ?? ls.xp,
              audioUrl:     ov.audioUrl     ?? null,
              audioEnabled: ov.audioEnabled ?? false,
              accessible,
            };
          }),
      };
    });

    res.json(result);
  } catch (err: any) {
    req.log?.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/* ════════════════════════════════════════════════════════════════════════════
 * GET /api/content/curriculum/:lessonId
 * Conteúdo completo de uma lição — bloqueado pelo checkPlanAccess.
 * ════════════════════════════════════════════════════════════════════════════ */
router.get("/curriculum/:lessonId", (req: any, res: any, next: any) => {
  // Injecto dinâmico do lessonId no middleware
  return checkPlanAccess("lesson", req.params.lessonId)(req, res, next);
}, async (req: any, res: any) => {
  try {
    const lesson = await db
      .select()
      .from(curriculumLessonsTable)
      .where(eq(curriculumLessonsTable.id, req.params.lessonId))
      .get();

    if (!lesson) return res.status(404).json({ error: "lesson_not_found" });

    // Overrides de admin
    const overrideRow = await db.select().from(adminSettingsTable)
      .where(eq(adminSettingsTable.key, "curriculum.override")).get();
    const overrides: Record<string, any> = overrideRow
      ? (() => { try { return (JSON.parse(overrideRow.value) as any).lessons ?? {}; } catch { return {}; } })()
      : {};
    const ov = overrides[lesson.id] ?? {};

    res.json({
      id:           lesson.id,
      levelId:      lesson.levelId,
      title:        ov.title        ?? lesson.title,
      summary:      ov.summary      ?? lesson.summary,
      xp:           ov.xp           ?? lesson.xp,
      content:      jsonParse(lesson.content,   []),
      questions:    jsonParse(lesson.questions, []),
      audioUrl:     ov.audioUrl     ?? null,
      audioEnabled: ov.audioEnabled ?? false,
    });
  } catch (err: any) {
    req.log?.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/* ════════════════════════════════════════════════════════════════════════════
 * GET /api/content/books
 * Lista de livros com campo accessible.
 * ════════════════════════════════════════════════════════════════════════════ */
router.get("/books", async (req: any, res: any) => {
  try {
    const userId = req.userId as string;
    const books  = await db.select().from(booksTable).orderBy(asc(booksTable.orderNum)).all();
    const { gatedIds, userPerms } = await buildAccessMap(userId, "book");

    res.json(books.map((r: any) => ({
      id:          r.id,
      order:       r.orderNum,
      title:       r.title,
      author:      r.author,
      cover:       r.cover,
      category:    r.category,
      description: r.description,
      pages:       r.pages,
      docxFile:    r.docxFile  ?? undefined,
      content:     r.content   ?? undefined,
      accessible:  canAccess(r.id, gatedIds, userPerms),
    })));
  } catch (err: any) {
    req.log?.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/* ════════════════════════════════════════════════════════════════════════════
 * GET /api/content/strategies
 * Lista de estratégias com campo accessible.
 * ════════════════════════════════════════════════════════════════════════════ */
router.get("/strategies", async (req: any, res: any) => {
  try {
    const userId     = req.userId as string;
    const strategies = await db.select().from(strategiesTable).orderBy(asc(strategiesTable.sortOrder)).all();
    const { gatedIds, userPerms } = await buildAccessMap(userId, "strategy");

    res.json(strategies.map((r: any) => ({
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
      accessible:     canAccess(r.id, gatedIds, userPerms),
    })));
  } catch (err: any) {
    req.log?.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/* ════════════════════════════════════════════════════════════════════════════
 * GET /api/content/resources
 * Secções de recursos com campo accessible por secção.
 * ════════════════════════════════════════════════════════════════════════════ */
router.get("/resources", async (req: any, res: any) => {
  try {
    const userId = req.userId as string;

    const [sections, items] = await Promise.all([
      db.select().from(resourceSectionsTable).orderBy(asc(resourceSectionsTable.sortOrder)).all(),
      db.select().from(resourceItemsTable).orderBy(asc(resourceItemsTable.sortOrder)).all(),
    ]);

    const { gatedIds, userPerms } = await buildAccessMap(userId, "resource_section");

    res.json(sections.map((s: any) => ({
      id:         s.id,
      title:      s.title,
      icon:       s.icon,
      color:      s.color,
      accessible: canAccess(s.id, gatedIds, userPerms),
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
    })));
  } catch (err: any) {
    req.log?.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/* ════════════════════════════════════════════════════════════════════════════
 * GET /api/content/videos
 * Vídeos da tabela videos (migrados de admin_settings via seedVideos).
 * Requer auth — sem checkPlanAccess por enquanto (controlo no frontend).
 * ════════════════════════════════════════════════════════════════════════════ */
router.get("/videos", async (req: any, res: any) => {
  try {
    const userId = req.userId as string;
    const rows = await db
      .select()
      .from(videosTable)
      .orderBy(asc(videosTable.sortOrder), asc(videosTable.createdAt))
      .all();

    const { gatedIds, userPerms } = await buildAccessMap(userId, "video");

    res.json(rows.map((v: any) => ({
      id:          v.id,
      creator:     v.creator,
      title:       v.title,
      level:       v.level,
      category:    v.category,
      tags:        jsonParse(v.tags, []),
      videoUrl:    v.videoUrl,
      description: v.description ?? undefined,
      order:       v.sortOrder,
      accessible:  canAccess(v.id, gatedIds, userPerms),
    })));
  } catch (err: any) {
    req.log?.error(err);
    res.status(500).json({ error: "internal" });
  }
});

export default router;
