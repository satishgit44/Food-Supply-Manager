import { Router } from "express";
import {
  reportInventory,
  reportPayments,
  reportSuppliers,
  reportRevenueByCategory,
  reportTopCustomers,
  reportMonthlySales,
} from "../controllers/reports.controller";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/error";

const router = Router();

router.get("/inventory-status", requireAuth, asyncHandler(reportInventory));
router.get("/payment-summary", requireAuth, asyncHandler(reportPayments));
router.get("/supplier-performance", requireAuth, asyncHandler(reportSuppliers));
router.get("/revenue-by-category", requireAuth, asyncHandler(reportRevenueByCategory));
router.get("/top-customers", requireAuth, asyncHandler(reportTopCustomers));
router.get("/monthly-sales", requireAuth, asyncHandler(reportMonthlySales));

export default router;
