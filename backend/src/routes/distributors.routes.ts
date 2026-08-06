import { Router } from "express";
import {
  getDistributors,
  addDistributor,
  updateDistributor,
  deleteDistributor,
} from "../controllers/distributors.controller";
import { requireAuth, requireWrite } from "../middleware/auth";
import { asyncHandler } from "../middleware/error";

const router = Router();

router.get("/", requireAuth, asyncHandler(getDistributors));
router.post("/", requireAuth, requireWrite, asyncHandler(addDistributor));
router.put("/:dId", requireAuth, requireWrite, asyncHandler(updateDistributor));
router.delete("/:dId", requireAuth, requireWrite, asyncHandler(deleteDistributor));

export default router;
