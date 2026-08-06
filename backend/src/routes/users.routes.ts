import { Router } from "express";
import {
  getUsers,
  updateUser,
  deleteUser,
  changeOwnPassword,
} from "../controllers/users.controller";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { asyncHandler } from "../middleware/error";

const router = Router();

router.get("/", requireAuth, requireAdmin, asyncHandler(getUsers));
router.put("/:userId", requireAuth, requireAdmin, asyncHandler(updateUser));
router.delete("/:userId", requireAuth, requireAdmin, asyncHandler(deleteUser));
router.put("/me/password", requireAuth, asyncHandler(changeOwnPassword));

export default router;
