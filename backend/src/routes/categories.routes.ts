import { Router } from "express";
import {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categories.controller";
import { requireAuth, requireWrite } from "../middleware/auth";
import { asyncHandler } from "../middleware/error";

const router = Router();

router.get("/", requireAuth, asyncHandler(getCategories));
router.post("/", requireAuth, requireWrite, asyncHandler(addCategory));
router.put("/:catId", requireAuth, requireWrite, asyncHandler(updateCategory));
router.delete("/:catId", requireAuth, requireWrite, asyncHandler(deleteCategory));

export default router;
