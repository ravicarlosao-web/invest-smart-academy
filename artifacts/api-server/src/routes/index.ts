import { Router, type IRouter } from "express";
import healthRouter        from "./health";
import authRouter          from "./auth";
import progressRouter      from "./progress";
import tradesRouter        from "./trades";
import notificationsRouter from "./notifications";
import duelosRouter        from "./duelos";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth",          authRouter);
router.use("/progress",      progressRouter);
router.use("/trades",        tradesRouter);
router.use("/notifications", notificationsRouter);
router.use("/duelos",        duelosRouter);

export default router;
