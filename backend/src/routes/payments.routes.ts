import { Router } from "express";
import {
  getPayments,
  addPayment,
  updatePayment,
  deletePayment,
} from "../controllers/payments.controller";
import { requireAuth, requireWrite } from "../middleware/auth";
import { asyncHandler } from "../middleware/error";

const router = Router();

router.get("/", requireAuth, asyncHandler(getPayments));
router.post("/", requireAuth, requireWrite, asyncHandler(addPayment));
router.put("/:payId", requireAuth, requireWrite, asyncHandler(updatePayment));
router.delete("/:payId", requireAuth, requireWrite, asyncHandler(deletePayment));

export default router;
