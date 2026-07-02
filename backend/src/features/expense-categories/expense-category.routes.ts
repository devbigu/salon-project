import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";
import {
  createExpenseCategory,
  deleteExpenseCategory,
  getExpenseCategories,
  getExpenseCategory,
  setExpenseCategoryStatus,
  updateExpenseCategory,
} from "./expense-category.controller.js";

import { validateUuidParam } from "../../middlewares/uuid.middleware.js";

const router = Router();
router.param("id", validateUuidParam("id"));
router.use(authenticate);
router.use(requireRole("SUPER_ADMIN", "SALON_ADMIN"));
router.post("/", createExpenseCategory);
router.get("/", getExpenseCategories);
router.patch("/:id/status", setExpenseCategoryStatus);
router.get("/:id", getExpenseCategory);
router.put("/:id", updateExpenseCategory);
router.delete("/:id", deleteExpenseCategory);

export default router;
