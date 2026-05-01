// @ts-nocheck
import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { db, progressTable, eq } from "@workspace/db";
import { ProgressBody } from "@workspace/api-zod";
import { validate } from "../middlewares/validate.js";

const router = Router();

router.param("userId", (req: Request, res: Response, next: NextFunction, userId: string) => {
  if (req.userId !== userId) {
    return res.status(403).json({ error: "forbidden", message: "Acesso não autorizado." });
  }
  next();
});

/** GET /api/progress/:userId */
router.get("/:userId", async (req: any, res: any) => {
  try {
    const row = await db
      .select()
      .from(progressTable)
      .where(eq(progressTable.userId, String(req.params.userId)))
      .get();

    if (!row) return res.status(404).json({ error: "not_found" });

    res.json({
      ...row,
      completedLessons: JSON.parse(row.completedLessons),
      quizScores:       JSON.parse(row.quizScores),
      achievements:     JSON.parse(row.achievements),
      reviewQueue:      JSON.parse(row.reviewQueue),
      dailyMissions:    JSON.parse(row.dailyMissions),
      userInterests:    JSON.parse(row.userInterests),
      settings:         JSON.parse(row.settings),
      booksProgress:    JSON.parse(row.booksProgress),
      seenAchievements: JSON.parse(row.seenAchievements),
      watchedVideos:    JSON.parse(row.watchedVideos),
      onboarded:        row.onboarded === 1,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/** PUT /api/progress/:userId — upsert full progress + settings + onboarding */
router.put("/:userId", validate(ProgressBody), async (req: any, res: any) => {
  try {
    const body = req.body;
    const now  = Date.now();

    const row = {
      userId: String(req.params.userId),
      xp:               body.xp               ?? 0,
      streakDays:       body.streakDays        ?? 0,
      lastActivityDay:  body.lastActivityDay   ?? null,
      perfectQuizCount: body.perfectQuizCount  ?? 0,
      missionDate:      body.missionDate       ?? null,
      completedLessons: JSON.stringify(body.completedLessons ?? []),
      quizScores:       JSON.stringify(body.quizScores       ?? {}),
      achievements:     JSON.stringify(body.achievements     ?? []),
      reviewQueue:      JSON.stringify(body.reviewQueue      ?? []),
      dailyMissions:    JSON.stringify(body.dailyMissions    ?? []),
      onboarded:        body.onboarded ? 1 : 0,
      userLevel:        body.userLevel         ?? null,
      userInterests:    JSON.stringify(body.userInterests    ?? []),
      settings:         JSON.stringify(body.settings         ?? {}),
      booksProgress:    JSON.stringify(body.booksProgress    ?? {}),
      seenAchievements: JSON.stringify(body.seenAchievements ?? []),
      watchedVideos:    JSON.stringify(body.watchedVideos    ?? []),
      simCashBalance:   body.simCashBalance    ?? 10000,
      updatedAt:        now,
    };

    await db
      .insert(progressTable)
      .values(row)
      .onConflictDoUpdate({ target: progressTable.userId, set: { ...row } });

    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal" });
  }
});

export default router;
