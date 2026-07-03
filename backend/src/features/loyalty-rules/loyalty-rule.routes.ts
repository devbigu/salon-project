import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";
import { validateUuidParam } from "../../middlewares/uuid.middleware.js";
import {
  createRule,
  getActiveRule,
  getRule,
  getRules,
  setRuleStatus,
  updateRule,
} from "./loyalty-rule.controller.js";

const router = Router();
router.param("id", validateUuidParam("id"));
router.use(authenticate);

router.post(
  "/",
  requireRole("SUPER_ADMIN", "SALON_ADMIN"),
  createRule
);
router.get(
  "/",
  requireRole(
    "SUPER_ADMIN",
    "SALON_ADMIN",
    "BRANCH_MANAGER",
    "RECEPTIONIST"
  ),
  getRules
);
router.get(
  "/active",
  requireRole(
    "SUPER_ADMIN",
    "SALON_ADMIN",
    "BRANCH_MANAGER",
    "RECEPTIONIST"
  ),
  getActiveRule
);
router.get(
  "/:id",
  requireRole(
    "SUPER_ADMIN",
    "SALON_ADMIN",
    "BRANCH_MANAGER",
    "RECEPTIONIST"
  ),
  getRule
);
router.put(
  "/:id",
  requireRole("SUPER_ADMIN", "SALON_ADMIN"),
  updateRule
);
router.patch(
  "/:id/status",
  requireRole("SUPER_ADMIN", "SALON_ADMIN"),
  setRuleStatus
);

export default router;
