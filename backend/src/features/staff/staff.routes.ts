import { Router } from "express";
import {
  createStaff,
  getStaff,
  getStaffById,
  updateStaff,
  updateStaffStatus,
  deleteStaff,
} from "./staff.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";

const router = Router();

router.use(authenticate);

router.post("/", requireRole("SUPER_ADMIN", "SALON_ADMIN"), createStaff);

router.get("/", requireRole("SUPER_ADMIN", "SALON_ADMIN"), getStaff);

router.get("/:id", requireRole("SUPER_ADMIN", "SALON_ADMIN"), getStaffById);

router.put("/:id", requireRole("SUPER_ADMIN", "SALON_ADMIN"), updateStaff);

router.patch(
  "/:id/status",
  requireRole("SUPER_ADMIN", "SALON_ADMIN"),
  updateStaffStatus
);

router.delete("/:id", requireRole("SUPER_ADMIN", "SALON_ADMIN"), deleteStaff);

export default router;
