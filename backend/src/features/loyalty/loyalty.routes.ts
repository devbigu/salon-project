import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";
import { validateUuidParam } from "../../middlewares/uuid.middleware.js";
import {
  adjustCustomerLoyaltyPoints,
  getCustomerLoyaltyTransactions,
} from "./loyalty.controller.js";

const router = Router();
router.param("customerId", validateUuidParam("customerId"));
router.use(authenticate);

router.get(
  "/customers/:customerId/transactions",
  requireRole("SUPER_ADMIN", "SALON_ADMIN", "RECEPTIONIST", "STAFF"),
  getCustomerLoyaltyTransactions
);
router.post(
  "/customers/:customerId/adjust",
  requireRole("SUPER_ADMIN", "SALON_ADMIN"),
  adjustCustomerLoyaltyPoints
);

export default router;
