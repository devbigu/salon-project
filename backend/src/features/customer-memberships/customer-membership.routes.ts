import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";
import { validateUuidParam } from "../../middlewares/uuid.middleware.js";
import {
  cancelCustomerMembership,
  expireCustomerMembership,
  getAllCustomerMemberships,
  getCustomerMembership,
  removeCustomerMembership,
} from "./customer-membership.controller.js";

const router = Router();
router.param("id", validateUuidParam("id"));
router.use(authenticate);
router.use(
  requireRole(
    "SUPER_ADMIN",
    "SALON_ADMIN",
    "BRANCH_MANAGER",
    "RECEPTIONIST"
  )
);

router.get("/", getAllCustomerMemberships);
router.get("/:id", getCustomerMembership);
router.patch("/:id/cancel", cancelCustomerMembership);
router.patch("/:id/remove", removeCustomerMembership);
router.patch("/:id/expire", expireCustomerMembership);

export default router;
