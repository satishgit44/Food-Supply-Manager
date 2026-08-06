import { Router } from "express";
import {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/products.controller";
import { requireAuth, requireWrite } from "../middleware/auth";
import { asyncHandler } from "../middleware/error";

const router = Router();

router.get("/", requireAuth, asyncHandler(getProducts));
router.post("/", requireAuth, requireWrite, asyncHandler(addProduct));
router.put("/:pId", requireAuth, requireWrite, asyncHandler(updateProduct));
router.delete("/:pId", requireAuth, requireWrite, asyncHandler(deleteProduct));

export default router;
