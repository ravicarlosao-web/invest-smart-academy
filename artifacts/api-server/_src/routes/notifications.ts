// @ts-nocheck
import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { db, notificationsTable, eq, desc } from "@workspace/db";

const router = Router();

router.param("userId", (req: Request, res: Response, next: NextFunction, userId: string) => {
  if (req.userId !== userId) {
    return res.status(403).json({ error: "forbidden", message: "Acesso não autorizado." });
  }
  next();
});

/** GET /api/notifications/:userId?limit=50 */
router.get("/:userId", async (req: any, res: any) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const rows = await db
      .select()
      .from(notificationsTable)
      .where(eq(notificationsTable.userId, String(req.params.userId)))
      .orderBy(desc(notificationsTable.createdAt))
      .limit(limit)
      .all();

    res.json(rows.map((r: any) => ({ ...r, read: r.isRead === 1 })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/** POST /api/notifications/:userId — insert one notification */
router.post("/:userId", async (req: any, res: any) => {
  try {
    const b = req.body;
    const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    await db.insert(notificationsTable).values({
      id,
      userId:    req.params.userId,
      type:      String(b.type),
      title:     String(b.title),
      message:   String(b.message),
      link:      b.link ? String(b.link) : null,
      isRead:    0,
      createdAt: Date.now(),
    });
    res.json({ ok: true, id });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/** PATCH /api/notifications/:userId/read-all — mark all read */
router.patch("/:userId/read-all", async (req: any, res: any) => {
  try {
    await db
      .update(notificationsTable)
      .set({ isRead: 1 })
      .where(eq(notificationsTable.userId, String(req.params.userId)));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/** DELETE /api/notifications/:userId/:id */
router.delete("/:userId/:id", async (req: any, res: any) => {
  try {
    await db
      .delete(notificationsTable)
      .where(eq(notificationsTable.id, String(req.params.id)));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

export default router;
