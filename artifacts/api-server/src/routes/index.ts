import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import dashboardRouter from "./dashboard";
import inventoryRouter from "./inventory";
import transactionsRouter from "./transactions";
import rejectRouter from "./reject";
import musicRouter from "./music";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(dashboardRouter);
router.use(inventoryRouter);
router.use(transactionsRouter);
router.use(rejectRouter);
router.use(musicRouter);

export default router;
