// @ts-nocheck
import { Router } from "express";
import { requireAuth, requireEmailVerified, requireRole } from "../middlewares/auth.js";
import {
  db, eq, and, gt, desc, asc,
  plansTable,
  planPermissionsTable,
  subscriptionsTable,
} from "@workspace/db";

const adminRouter = Router();
const userRouter  = Router();

const requireAdminFull = requireRole("administrador", "master");

function genPlanId(): string {
  return `plan_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}
function genPermId(): string {
  return `perm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

/* ════════════════════════════════════════════════════════════════════════════
 * ADMIN ROUTES — montado em /api/admin/plans
 * ════════════════════════════════════════════════════════════════════════════ */

/** GET /api/admin/plans — lista todos os planos com contagens */
adminRouter.get("/", requireAdminFull, async (req: any, res: any) => {
  try {
    const plans = await db.select().from(plansTable).orderBy(asc(plansTable.createdAt)).all();
    const perms = await db.select().from(planPermissionsTable).all();
    const now   = Date.now();
    const subs  = await db
      .select({ planId: subscriptionsTable.planId, status: subscriptionsTable.status, expiresAt: subscriptionsTable.expiresAt })
      .from(subscriptionsTable)
      .all();

    const result = plans.map((p: any) => ({
      ...p,
      permissionsCount: perms.filter((pp: any) => pp.planId === p.id).length,
      activeSubsCount:  subs.filter((s: any) => s.planId === p.id && s.status === "active" && (s.expiresAt ?? 0) > now).length,
    }));

    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/** GET /api/admin/plans/:id — plano + todas as permissões */
adminRouter.get("/:id", requireAdminFull, async (req: any, res: any) => {
  try {
    const plan = await db.select().from(plansTable).where(eq(plansTable.id, req.params.id)).get();
    if (!plan) return res.status(404).json({ error: "not_found" });

    const permissions = await db
      .select()
      .from(planPermissionsTable)
      .where(eq(planPermissionsTable.planId, req.params.id))
      .orderBy(asc(planPermissionsTable.createdAt))
      .all();

    res.json({ ...plan, permissions });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/** POST /api/admin/plans — criar plano */
adminRouter.post("/", requireAdminFull, async (req: any, res: any) => {
  try {
    const { name, description, priceAoa, durationDays, isActive, isDefault } = req.body;
    if (!name) return res.status(400).json({ error: "name_required" });

    const now = Date.now();
    const id  = genPlanId();

    /* Se o novo plano é default, remove default dos existentes */
    if (isDefault) {
      await db.update(plansTable).set({ isDefault: 0, updatedAt: now }).where(eq(plansTable.isDefault, 1));
    }

    await db.insert(plansTable).values({
      id,
      name,
      description:  description  ?? null,
      priceAoa:     priceAoa     ?? 0,
      durationDays: durationDays ?? 30,
      isActive:     isActive     ?? 1,
      isDefault:    isDefault    ? 1 : 0,
      createdBy:    req.userId,
      createdAt:    now,
      updatedAt:    now,
    });

    const plan = await db.select().from(plansTable).where(eq(plansTable.id, id)).get();
    res.status(201).json(plan);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/** PUT /api/admin/plans/:id — editar plano */
adminRouter.put("/:id", requireAdminFull, async (req: any, res: any) => {
  try {
    const existing = await db.select().from(plansTable).where(eq(plansTable.id, req.params.id)).get();
    if (!existing) return res.status(404).json({ error: "not_found" });

    /* Não permitir desactivar o plano default */
    if (existing.isDefault && req.body.isActive === 0) {
      return res.status(400).json({
        error: "cannot_deactivate_default",
        message: "Não é possível desactivar o plano gratuito default.",
      });
    }

    const now = Date.now();
    await db.update(plansTable).set({
      name:         req.body.name         ?? existing.name,
      description:  req.body.description  ?? existing.description,
      priceAoa:     req.body.priceAoa     ?? existing.priceAoa,
      durationDays: req.body.durationDays ?? existing.durationDays,
      isActive:     req.body.isActive     ?? existing.isActive,
      updatedAt:    now,
    }).where(eq(plansTable.id, req.params.id));

    const plan = await db.select().from(plansTable).where(eq(plansTable.id, req.params.id)).get();
    res.json(plan);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/** DELETE /api/admin/plans/:id — apagar plano */
adminRouter.delete("/:id", requireAdminFull, async (req: any, res: any) => {
  try {
    const existing = await db.select().from(plansTable).where(eq(plansTable.id, req.params.id)).get();
    if (!existing) return res.status(404).json({ error: "not_found" });

    if (existing.isDefault) {
      return res.status(400).json({
        error: "cannot_delete_default",
        message: "Não é possível apagar o plano gratuito default.",
      });
    }

    const now = Date.now();
    const activeSubs = await db
      .select({ id: subscriptionsTable.id })
      .from(subscriptionsTable)
      .where(
        and(
          eq(subscriptionsTable.planId, req.params.id),
          eq(subscriptionsTable.status, "active"),
          gt(subscriptionsTable.expiresAt, now),
        ),
      )
      .all();

    if (activeSubs.length > 0) {
      return res.status(409).json({
        error: "has_active_subscriptions",
        message: `Existem ${activeSubs.length} subscrição(ões) activa(s) neste plano. Remove-as primeiro.`,
      });
    }

    await db.delete(planPermissionsTable).where(eq(planPermissionsTable.planId, req.params.id));
    await db.delete(plansTable).where(eq(plansTable.id, req.params.id));

    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/** PATCH /api/admin/plans/:id/set-default — define como plano default */
adminRouter.patch("/:id/set-default", requireAdminFull, async (req: any, res: any) => {
  try {
    const existing = await db.select().from(plansTable).where(eq(plansTable.id, req.params.id)).get();
    if (!existing) return res.status(404).json({ error: "not_found" });

    const now = Date.now();
    await db.update(plansTable).set({ isDefault: 0, updatedAt: now }).where(eq(plansTable.isDefault, 1));
    await db.update(plansTable).set({ isDefault: 1, updatedAt: now }).where(eq(plansTable.id, req.params.id));

    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/* ── PERMISSÕES ──────────────────────────────────────────────────────────── */

/** GET /api/admin/plans/:id/permissions */
adminRouter.get("/:id/permissions", requireAdminFull, async (req: any, res: any) => {
  try {
    const perms = await db
      .select()
      .from(planPermissionsTable)
      .where(eq(planPermissionsTable.planId, req.params.id))
      .orderBy(asc(planPermissionsTable.createdAt))
      .all();
    res.json(perms);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/** POST /api/admin/plans/:id/permissions — adicionar permissão */
adminRouter.post("/:id/permissions", requireAdminFull, async (req: any, res: any) => {
  try {
    const plan = await db.select().from(plansTable).where(eq(plansTable.id, req.params.id)).get();
    if (!plan) return res.status(404).json({ error: "plan_not_found" });

    const { contentType, contentId } = req.body;
    if (!contentType || contentId === undefined || contentId === null) {
      return res.status(400).json({ error: "content_type_and_id_required" });
    }

    const id  = genPermId();
    const now = Date.now();

    await db.insert(planPermissionsTable).values({
      id,
      planId:      req.params.id,
      contentType,
      contentId:   String(contentId),
      createdAt:   now,
    });

    const perm = await db.select().from(planPermissionsTable).where(eq(planPermissionsTable.id, id)).get();
    res.status(201).json(perm);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/** DELETE /api/admin/plans/:id/permissions/:permId — remover permissão */
adminRouter.delete("/:id/permissions/:permId", requireAdminFull, async (req: any, res: any) => {
  try {
    const perm = await db
      .select()
      .from(planPermissionsTable)
      .where(
        and(
          eq(planPermissionsTable.id, req.params.permId),
          eq(planPermissionsTable.planId, req.params.id),
        ),
      )
      .get();

    if (!perm) return res.status(404).json({ error: "not_found" });

    await db.delete(planPermissionsTable).where(eq(planPermissionsTable.id, req.params.permId));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/* ════════════════════════════════════════════════════════════════════════════
 * USER ROUTES — montado em /api/plans  (requireAuth já aplicado no router pai)
 * ════════════════════════════════════════════════════════════════════════════ */

/**
 * GET /api/plans — lista planos activos para o utilizador escolher
 */
userRouter.get("/", async (req: any, res: any) => {
  try {
    const plans = await db
      .select()
      .from(plansTable)
      .where(eq(plansTable.isActive, 1))
      .orderBy(asc(plansTable.createdAt))
      .all();
    res.json(plans);
  } catch (err) {
    req.log?.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/**
 * GET /api/plans/my-plan
 * Retorna o plano activo do utilizador + lista de content_ids acessíveis.
 */
userRouter.get("/my-plan", async (req: any, res: any) => {
  try {
    const userId = req.userId as string;
    const now    = Date.now();
    let   planId: string | null = null;
    let   subscription: any     = null;

    /* 1. Subscrição activa */
    const activeSub = await db
      .select()
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
      planId      = activeSub.planId;
      subscription = activeSub;
    } else {
      /* 2. Plano default (gratuito) */
      const defaultPlan = await db
        .select({ id: plansTable.id })
        .from(plansTable)
        .where(eq(plansTable.isDefault, 1))
        .limit(1)
        .get();

      if (defaultPlan) planId = defaultPlan.id;
    }

    if (!planId) {
      return res.json({ plan: null, permissions: [] });
    }

    /* 3. Detalhes do plano + permissões */
    const plan  = await db.select().from(plansTable).where(eq(plansTable.id, planId)).get();
    const perms = await db
      .select()
      .from(planPermissionsTable)
      .where(eq(planPermissionsTable.planId, planId))
      .all();

    res.json({
      plan,
      subscription: subscription ? {
        id:       subscription.id,
        status:   subscription.status,
        expiresAt: subscription.expiresAt,
      } : null,
      permissions: perms.map((p: any) => ({
        contentType: p.contentType,
        contentId:   p.contentId,
      })),
    });
  } catch (err: any) {
    req.log?.error(err);
    res.status(500).json({ error: "internal" });
  }
});

export { adminRouter as plansAdminRouter, userRouter as plansUserRouter };
