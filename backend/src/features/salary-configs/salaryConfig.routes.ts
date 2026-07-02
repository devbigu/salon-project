import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";
import {
  createSalaryConfig,
  getSalaryConfig,
  getStaffSalaryConfig,
  setSalaryConfigStatus,
  updateSalaryConfig,
} from "./salaryConfig.controller.js";

import { validateUuidParam } from "../../middlewares/uuid.middleware.js";

const router = Router();
router.param("id", validateUuidParam("id"));
router.param("staffId", validateUuidParam("staffId"));
router.use(authenticate);
router.post("/staff/:staffId/salary-config", requireRole("SUPER_ADMIN", "SALON_ADMIN", "BRANCH_MANAGER"), createSalaryConfig);
router.get("/staff/:staffId/salary-config", requireRole("SUPER_ADMIN", "SALON_ADMIN", "BRANCH_MANAGER", "STAFF"), getStaffSalaryConfig);
router.get("/salary-configs/:id", requireRole("SUPER_ADMIN", "SALON_ADMIN", "BRANCH_MANAGER", "STAFF"), getSalaryConfig);
router.put("/salary-configs/:id", requireRole("SUPER_ADMIN", "SALON_ADMIN", "BRANCH_MANAGER"), updateSalaryConfig);
router.patch("/salary-configs/:id/status", requireRole("SUPER_ADMIN", "SALON_ADMIN", "BRANCH_MANAGER"), setSalaryConfigStatus);
export default router;
