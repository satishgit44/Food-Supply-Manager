import { Router } from "express";
import {
  getWarehouses,
  addWarehouse,
  updateWarehouse,
  deleteWarehouse,
} from "../controllers/warehouses.controller";
import { requireAuth, requireWrite } from "../middleware/auth";
import { asyncHandler } from "../middleware/error";

const router = Router();

router.get("/", requireAuth, asyncHandler(getWarehouses));
router.post("/", requireAuth, requireWrite, asyncHandler(addWarehouse));
router.put("/:wId", requireAuth, requireWrite, asyncHandler(updateWarehouse));
router.delete("/:wId", requireAuth, requireWrite, asyncHandler(deleteWarehouse));

export default router;
