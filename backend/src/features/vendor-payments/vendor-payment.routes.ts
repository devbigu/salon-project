import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";
import {
  createVendorPayment,
  getVendorPayment,
  getVendorPayments,
} from "./vendor-payment.controller.js";

const router = Router();
router.use(authenticate);
router.post(
  "/",
  requireRole("SUPER_ADMIN", "SALON_ADMIN"),
  createVendorPayment
);
router.get(
  "/",
  requireRole("SUPER_ADMIN", "SALON_ADMIN", "BRANCH_MANAGER"),
  getVendorPayments
);
router.get(
  "/:id",
  requireRole("SUPER_ADMIN", "SALON_ADMIN", "BRANCH_MANAGER"),
  getVendorPayment
);

export default router;
