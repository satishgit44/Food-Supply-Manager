import { Router } from "express";
import { getDashboardStats } from "../controllers/dashboard.controller";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/error";

const router = Router();

router.get("/stats", requireAuth, asyncHandler(getDashboardStats));

export default router;
