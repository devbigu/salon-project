import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";
import {
  cancelSalarySlip,
  generateSalarySlip,
  getSalarySlip,
  getSalarySlips,
  markSalarySlipPaid,
  downloadSalarySlipPdf,
} from "./salarySlip.controller.js";

import { validateUuidParam } from "../../middlewares/uuid.middleware.js";

const router = Router();
router.param("id", validateUuidParam("id"));
router.use(authenticate);
router.post("/generate", requireRole("SUPER_ADMIN", "SALON_ADMIN", "BRANCH_MANAGER"), generateSalarySlip);
router.get("/", requireRole("SUPER_ADMIN", "SALON_ADMIN", "BRANCH_MANAGER", "STAFF"), getSalarySlips);
router.get("/:id/pdf", requireRole("SUPER_ADMIN", "SALON_ADMIN", "BRANCH_MANAGER", "STAFF"), downloadSalarySlipPdf);
router.get("/:id", requireRole("SUPER_ADMIN", "SALON_ADMIN", "BRANCH_MANAGER", "STAFF"), getSalarySlip);
router.patch("/:id/mark-paid", requireRole("SUPER_ADMIN", "SALON_ADMIN", "BRANCH_MANAGER"), markSalarySlipPaid);
router.patch("/:id/cancel", requireRole("SUPER_ADMIN", "SALON_ADMIN", "BRANCH_MANAGER"), cancelSalarySlip);
export default router;
