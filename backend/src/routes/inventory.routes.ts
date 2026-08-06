import { Router } from "express";
import {
  getInventory,
  getLowStock,
  addInventory,
  updateInventory,
  deleteInventory,
} from "../controllers/inventory.controller";
import { requireAuth, requireWrite } from "../middleware/auth";
import { asyncHandler } from "../middleware/error";

const router = Router();

router.get("/low-stock", requireAuth, asyncHandler(getLowStock));
router.get("/", requireAuth, asyncHandler(getInventory));
router.post("/", requireAuth, requireWrite, asyncHandler(addInventory));
router.put("/:invId", requireAuth, requireWrite, asyncHandler(updateInventory));
router.delete("/:invId", requireAuth, requireWrite, asyncHandler(deleteInventory));

export default router;
