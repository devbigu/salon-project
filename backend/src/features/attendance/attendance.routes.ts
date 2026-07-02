import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";
import {
  checkIn,
  checkOut,
  getAttendance,
  getStaffAttendance,
  markAttendance,
} from "./attendance.controller.js";

import { validateUuidParam } from "../../middlewares/uuid.middleware.js";

const router = Router();
router.param("staffId", validateUuidParam("staffId"));

router.use(authenticate);

router.post(
  "/check-in",
  requireRole("SUPER_ADMIN", "SALON_ADMIN", "BRANCH_MANAGER", "RECEPTIONIST", "STAFF"),
  checkIn
);
router.post(
  "/check-out",
  requireRole("SUPER_ADMIN", "SALON_ADMIN", "BRANCH_MANAGER", "RECEPTIONIST", "STAFF"),
  checkOut
);
router.post(
  "/mark",
  requireRole("SUPER_ADMIN", "SALON_ADMIN", "BRANCH_MANAGER", "RECEPTIONIST"),
  markAttendance
);
router.get(
  "/",
  requireRole("SUPER_ADMIN", "SALON_ADMIN", "BRANCH_MANAGER", "RECEPTIONIST", "STAFF"),
  getAttendance
);
router.get(
  "/staff/:staffId",
  requireRole("SUPER_ADMIN", "SALON_ADMIN", "BRANCH_MANAGER", "RECEPTIONIST", "STAFF"),
  getStaffAttendance
);

export default router;
