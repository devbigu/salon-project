import { Router } from "express";

import {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointmentBasicDetails,
  updateAppointmentStatus,
  deleteAppointment,
  rescheduleAppointment,
  getAppointmentTracking,
} from "./appointment.controller.js";

import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";

const router = Router();

router.use(authenticate);
router.post("/", requireRole("SUPER_ADMIN", "SALON_ADMIN", "STAFF"), createAppointment);

router.get("/", requireRole("SUPER_ADMIN", "SALON_ADMIN", "STAFF"), getAppointments);

router.patch("/:id/status", requireRole("SUPER_ADMIN", "SALON_ADMIN", "STAFF"), updateAppointmentStatus);

router.patch("/:id/reschedule", requireRole("SUPER_ADMIN", "SALON_ADMIN", "STAFF"), rescheduleAppointment);

router.get("/:id", requireRole("SUPER_ADMIN", "SALON_ADMIN", "STAFF"), getAppointmentById);

router.put("/:id", requireRole("SUPER_ADMIN", "SALON_ADMIN", "STAFF"), updateAppointmentBasicDetails);

router.delete("/:id", requireRole("SUPER_ADMIN", "SALON_ADMIN"), deleteAppointment);

router.get("/:id/tracking",requireRole("SUPER_ADMIN", "SALON_ADMIN", "STAFF"),getAppointmentTracking
);
export default router;