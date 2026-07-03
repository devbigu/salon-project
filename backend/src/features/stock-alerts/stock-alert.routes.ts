import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";
import { validateUuidParam } from "../../middlewares/uuid.middleware.js";
import {
  getOpenStockAlerts,
  getStockAlert,
  getStockAlerts,
  resolveStockAlert,
} from "./stock-alert.controller.js";

const router = Router();
router.param("id", validateUuidParam("id"));
router.use(authenticate);

router.get(
  "/open",
  requireRole(
    "SUPER_ADMIN",
    "SALON_ADMIN",
    "BRANCH_MANAGER",
    "RECEPTIONIST",
    "STAFF"
  ),
  getOpenStockAlerts
);
router.get(
  "/",
  requireRole(
    "SUPER_ADMIN",
    "SALON_ADMIN",
    "BRANCH_MANAGER",
    "RECEPTIONIST",
    "STAFF"
  ),
  getStockAlerts
);
router.get(
  "/:id",
  requireRole(
    "SUPER_ADMIN",
    "SALON_ADMIN",
    "BRANCH_MANAGER",
    "RECEPTIONIST",
    "STAFF"
  ),
  getStockAlert
);
router.patch(
  "/:id/resolve",
  requireRole("SUPER_ADMIN", "SALON_ADMIN"),
  resolveStockAlert
);

export default router;
