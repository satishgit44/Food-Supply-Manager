import { Router } from "express";
import {
  getCustomers,
  addCustomer,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customers.controller";
import { requireAuth, requireWrite } from "../middleware/auth";
import { asyncHandler } from "../middleware/error";

const router = Router();

router.get("/", requireAuth, asyncHandler(getCustomers));
router.post("/", requireAuth, requireWrite, asyncHandler(addCustomer));
router.put("/:cId", requireAuth, requireWrite, asyncHandler(updateCustomer));
router.delete("/:cId", requireAuth, requireWrite, asyncHandler(deleteCustomer));

export default router;
