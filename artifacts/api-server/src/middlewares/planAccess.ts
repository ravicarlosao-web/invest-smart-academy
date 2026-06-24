// @ts-nocheck
/**
 * planAccess.ts
 *
 * Middleware de verificação de acesso a conteúdo baseado em planos.
 * Usa a subscrição activa do utilizador para obter o planId;
 * se não tiver subscrição activa, usa o plano default (gratuito).
 * Verifica permissões directas OU de nível inteiro (para lições).
 */

import type { Request, Response, NextFunction } from "express";
import {
  db, eq, and, gt, desc,
  subscriptionsTable,
  plansTable,
  planPermissionsTable,
  curriculumLessonsTable,
} from "@workspace/db";

export function checkPlanAccess(contentType: string, contentId: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({ error: "unauthorized" });
        return;
      }

      const now = Date.now();
      let planId: string | null = null;

      /* 1. Busca subscrição activa do utilizador */
      const activeSub = await db
        .select({ planId: subscriptionsTable.planId })
        .from(subscriptionsTable)
        .where(
          and(
            eq(subscriptionsTable.userId, userId),
            eq(subscriptionsTable.status, "active"),
            gt(subscriptionsTable.expiresAt, now),
          ),
        )
        .orderBy(desc(subscriptionsTable.createdAt))
        .limit(1)
        .get();

      if (activeSub?.planId) {
        planId = activeSub.planId;
      } else {
        /* 2. Sem subscrição activa — usa o plano default (gratuito) */
        const defaultPlan = await db
          .select({ id: plansTable.id })
          .from(plansTable)
          .where(eq(plansTable.isDefault, 1))
          .limit(1)
          .get();

        if (defaultPlan) {
          planId = defaultPlan.id;
        }
      }

      if (!planId) {
        res.status(403).json({ error: "PLAN_ACCESS_DENIED", contentType, contentId });
        return;
      }

      /* 3. Verificar permissão directa (contentType + contentId exacto) */
      const directPerm = await db
        .select({ id: planPermissionsTable.id })
        .from(planPermissionsTable)
        .where(
          and(
            eq(planPermissionsTable.planId, planId),
            eq(planPermissionsTable.contentType, contentType),
            eq(planPermissionsTable.contentId, contentId),
          ),
        )
        .get();

      if (directPerm) {
        next();
        return;
      }

      /* 4. Para lições: verificar se o nível inteiro está permitido */
      if (contentType === "lesson") {
        const lesson = await db
          .select({ levelId: curriculumLessonsTable.levelId })
          .from(curriculumLessonsTable)
          .where(eq(curriculumLessonsTable.id, contentId))
          .get();

        if (lesson) {
          const levelPerm = await db
            .select({ id: planPermissionsTable.id })
            .from(planPermissionsTable)
            .where(
              and(
                eq(planPermissionsTable.planId, planId),
                eq(planPermissionsTable.contentType, "level"),
                eq(planPermissionsTable.contentId, String(lesson.levelId)),
              ),
            )
            .get();

          if (levelPerm) {
            next();
            return;
          }
        }
      }

      /* 5. Sem permissão */
      res.status(403).json({ error: "PLAN_ACCESS_DENIED", contentType, contentId });
    } catch (err: any) {
      (req as any).log?.error(err);
      res.status(500).json({ error: "internal" });
    }
  };
}
