import { Router } from "express";
import healthRouter        from "./health";
import authRouter          from "./auth";
import progressRouter      from "./progress";
import tradesRouter        from "./trades";
import notificationsRouter from "./notifications";
import duelosRouter        from "./duelos";
import adminRouter         from "./admin";
import subscriptionsRouter from "./subscriptions";
import { db, adminSettingsTable, eq } from "@workspace/db";

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

async function getContent(key: string, res: import("express").Response) {
  try {
    const row = await db
      .select()
      .from(adminSettingsTable)
      .where(eq(adminSettingsTable.key, key))
      .get();
    const data = row ? JSON.parse(row.value) : [];
    res.json(Array.isArray(data) ? data : []);
  } catch {
    res.json([]);
  }
}

router.get("/videos",     (_req, res) => getContent("content.videos",     res));
router.get("/glossary",   (_req, res) => getContent("content.glossary",   res));
router.get("/strategies", (_req, res) => getContent("content.strategies", res));
router.get("/books",      (_req, res) => getContent("content.books",      res));
router.get("/resources",  (_req, res) => getContent("content.resources",  res));
router.get("/curriculum", (_req, res) => getContent("content.curriculum", res));

export default router;
