import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";
import { validateUuidParam } from "../../middlewares/uuid.middleware.js";
import {
  createPublicBookingSetting,
  getPublicBookingSetting,
  listPublicBookingSettings,
  setPublicBookingSettingStatus,
  updatePublicBookingSetting,
} from "./public-booking-setting.controller.js";

const router = Router();
router.param("id", validateUuidParam("id"));
router.use(authenticate);

router.get(
  "/",
  requireRole("SUPER_ADMIN", "SALON_ADMIN", "BRANCH_MANAGER", "RECEPTIONIST"),
  listPublicBookingSettings
);
router.post(
  "/",
  requireRole("SUPER_ADMIN", "SALON_ADMIN", "BRANCH_MANAGER"),
  createPublicBookingSetting
);
router.get(
  "/:id",
  requireRole("SUPER_ADMIN", "SALON_ADMIN", "BRANCH_MANAGER", "RECEPTIONIST"),
  getPublicBookingSetting
);
router.put(
  "/:id",
  requireRole("SUPER_ADMIN", "SALON_ADMIN", "BRANCH_MANAGER"),
  updatePublicBookingSetting
);
router.patch(
  "/:id/status",
  requireRole("SUPER_ADMIN", "SALON_ADMIN", "BRANCH_MANAGER"),
  setPublicBookingSettingStatus
);

export default router;
