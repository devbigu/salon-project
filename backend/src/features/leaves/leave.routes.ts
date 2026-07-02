import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";
import {
  approveLeave,
  cancelLeave,
  createLeave,
  getLeaveById,
  getLeaves,
  rejectLeave,
} from "./leave.controller.js";

import { validateUuidParam } from "../../middlewares/uuid.middleware.js";

const router = Router();
router.param("id", validateUuidParam("id"));

router.use(authenticate);

router.post(
  "/",
  requireRole("SUPER_ADMIN", "SALON_ADMIN", "BRANCH_MANAGER", "RECEPTIONIST", "STAFF"),
  createLeave
);
router.get(
  "/",
  requireRole("SUPER_ADMIN", "SALON_ADMIN", "BRANCH_MANAGER", "RECEPTIONIST", "STAFF"),
  getLeaves
);
router.get(
  "/:id",
  requireRole("SUPER_ADMIN", "SALON_ADMIN", "BRANCH_MANAGER", "RECEPTIONIST", "STAFF"),
  getLeaveById
);
router.patch(
  "/:id/approve",
  requireRole("SUPER_ADMIN", "SALON_ADMIN", "BRANCH_MANAGER"),
  approveLeave
);
router.patch(
  "/:id/reject",
  requireRole("SUPER_ADMIN", "SALON_ADMIN", "BRANCH_MANAGER"),
  rejectLeave
);
router.patch(
  "/:id/cancel",
  requireRole("SUPER_ADMIN", "SALON_ADMIN", "BRANCH_MANAGER", "RECEPTIONIST", "STAFF"),
  cancelLeave
);

export default router;
