import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";
import {
  getExpenseReport,
  getInventoryReport,
  getProfitSummary,
  getStaffPerformance,
} from "./report.controller.js";

const router = Router();
router.use(authenticate);
router.get(
  "/inventory",
  requireRole(
    "SUPER_ADMIN",
    "SALON_ADMIN",
    "BRANCH_MANAGER",
    "RECEPTIONIST",
    "STAFF"
  ),
  getInventoryReport
);
router.get(
  "/staff-performance",
  requireRole("SUPER_ADMIN", "SALON_ADMIN", "BRANCH_MANAGER"),
  getStaffPerformance
);
router.get(
  "/expenses",
  requireRole("SUPER_ADMIN", "SALON_ADMIN"),
  getExpenseReport
);
router.get(
  "/profit-summary",
  requireRole("SUPER_ADMIN", "SALON_ADMIN"),
  getProfitSummary
);

export default router;
