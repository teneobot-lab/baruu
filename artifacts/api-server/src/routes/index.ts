import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import dashboardRouter from "./dashboard";
import inventoryRouter from "./inventory";
import transactionsRouter from "./transactions";
import rejectRouter from "./reject";
import musicRouter from "./music";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

// Public routes — no auth required
router.use(healthRouter);
router.use(authRouter);

// Protected routes — require JWT token
router.use(requireAuth(), dashboardRouter);
router.use(requireAuth(), inventoryRouter);
router.use(requireAuth(), transactionsRouter);
router.use(requireAuth(), rejectRouter);
router.use(requireAuth(), musicRouter);

export default router;