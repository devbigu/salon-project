import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";
import { validateUuidParam } from "../../middlewares/uuid.middleware.js";
import {
  createMembership,
  deleteMembership,
  getMembership,
  getMemberships,
  setMembershipStatus,
  updateMembership,
} from "./membership.controller.js";

const router = Router();
router.param("id", validateUuidParam("id"));
router.use(authenticate);

router.post(
  "/",
  requireRole("SUPER_ADMIN", "SALON_ADMIN"),
  createMembership
);
router.get(
  "/",
  requireRole(
    "SUPER_ADMIN",
    "SALON_ADMIN",
    "BRANCH_MANAGER",
    "RECEPTIONIST"
  ),
  getMemberships
);
router.get(
  "/:id",
  requireRole(
    "SUPER_ADMIN",
    "SALON_ADMIN",
    "BRANCH_MANAGER",
    "RECEPTIONIST"
  ),
  getMembership
);
router.put(
  "/:id",
  requireRole("SUPER_ADMIN", "SALON_ADMIN"),
  updateMembership
);
router.patch(
  "/:id/status",
  requireRole("SUPER_ADMIN", "SALON_ADMIN"),
  setMembershipStatus
);
router.delete(
  "/:id",
  requireRole("SUPER_ADMIN", "SALON_ADMIN"),
  deleteMembership
);

export default router;
