import { Router } from "express";
import healthRouter        from "./health";
import authRouter          from "./auth";
import progressRouter      from "./progress";
import tradesRouter        from "./trades";
import notificationsRouter from "./notifications";
import duelosRouter        from "./duelos";
import adminRouter         from "./admin";
import { db, adminSettingsTable, eq } from "@workspace/db";

const router = Router();

router.use(healthRouter);
router.use("/auth",          authRouter);
router.use("/progress",      progressRouter);
router.use("/trades",        tradesRouter);
router.use("/notifications", notificationsRouter);
router.use("/duelos",        duelosRouter);
router.use("/admin",         adminRouter);

/* Public video list — no auth required, students can fetch */
router.get("/videos", async (req, res) => {
  try {
    const row = await db
      .select()
      .from(adminSettingsTable)
      .where(eq(adminSettingsTable.key, "content.videos"))
      .get();
    const videos = row ? JSON.parse(row.value) : [];
    res.json(Array.isArray(videos) ? videos : []);
  } catch {
    res.json([]);
  }
});

export default router;
