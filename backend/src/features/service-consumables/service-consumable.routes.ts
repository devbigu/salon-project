import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";
import { validateUuidParam } from "../../middlewares/uuid.middleware.js";
import {
  createServiceConsumable,
  deleteServiceConsumable,
  getServiceConsumables,
  updateServiceConsumable,
} from "./service-consumable.controller.js";

export const serviceConsumableServiceRoutes = Router();
serviceConsumableServiceRoutes.param(
  "serviceId",
  validateUuidParam("serviceId")
);
serviceConsumableServiceRoutes.use(authenticate);
serviceConsumableServiceRoutes.post(
  "/:serviceId/consumables",
  requireRole("SUPER_ADMIN", "SALON_ADMIN"),
  createServiceConsumable
);
serviceConsumableServiceRoutes.get(
  "/:serviceId/consumables",
  requireRole(
    "SUPER_ADMIN",
    "SALON_ADMIN",
    "BRANCH_MANAGER",
    "RECEPTIONIST",
    "STAFF"
  ),
  getServiceConsumables
);

const router = Router();
router.param("id", validateUuidParam("id"));
router.use(authenticate);
router.put(
  "/:id",
  requireRole("SUPER_ADMIN", "SALON_ADMIN"),
  updateServiceConsumable
);
router.delete(
  "/:id",
  requireRole("SUPER_ADMIN", "SALON_ADMIN"),
  deleteServiceConsumable
);

export default router;
