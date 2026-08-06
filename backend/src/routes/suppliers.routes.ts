import { Router } from "express";
import {
  getSuppliers,
  addSupplier,
  updateSupplier,
  deleteSupplier,
} from "../controllers/suppliers.controller";
import { requireAuth, requireWrite } from "../middleware/auth";
import { asyncHandler } from "../middleware/error";

const router = Router();

router.get("/", requireAuth, asyncHandler(getSuppliers));
router.post("/", requireAuth, requireWrite, asyncHandler(addSupplier));
router.put("/:sId", requireAuth, requireWrite, asyncHandler(updateSupplier));
router.delete("/:sId", requireAuth, requireWrite, asyncHandler(deleteSupplier));

export default router;
