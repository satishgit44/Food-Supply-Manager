import { Router } from "express";
import {
  getOrders,
  addOrder,
  updateOrder,
  deleteOrder,
} from "../controllers/orders.controller";
import { requireAuth, requireWrite } from "../middleware/auth";
import { asyncHandler } from "../middleware/error";

const router = Router();

router.get("/", requireAuth, asyncHandler(getOrders));
router.post("/", requireAuth, requireWrite, asyncHandler(addOrder));
router.put("/:oId", requireAuth, requireWrite, asyncHandler(updateOrder));
router.delete("/:oId", requireAuth, requireWrite, asyncHandler(deleteOrder));

export default router;
