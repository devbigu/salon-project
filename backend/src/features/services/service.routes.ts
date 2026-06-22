import { Router } from "express";

import {
  createService,
  getServices,
  getServiceById,
  updateService,
  updateServiceStatus,
  deleteService,
  seedDefaultServices,
} from "./service.controller.js";

import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  requireRole("SUPER_ADMIN", "SALON_ADMIN"),
  createService
);

router.get(
  "/",
  requireRole("SUPER_ADMIN", "SALON_ADMIN", "RECEPTIONIST", "STAFF"),
  getServices
);

router.post(
  "/seed-defaults",
  requireRole("SUPER_ADMIN", "SALON_ADMIN"),
  seedDefaultServices
);

router.patch(
  "/:id/status",
  requireRole("SUPER_ADMIN", "SALON_ADMIN"),
  updateServiceStatus
);

router.get(
  "/:id",
  requireRole("SUPER_ADMIN", "SALON_ADMIN", "RECEPTIONIST", "STAFF"),
  getServiceById
);

router.put(
  "/:id",
  requireRole("SUPER_ADMIN", "SALON_ADMIN"),
  updateService
);

router.delete(
  "/:id",
  requireRole("SUPER_ADMIN", "SALON_ADMIN"),
  deleteService
);

export default router;
