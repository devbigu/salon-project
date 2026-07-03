import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";
import { validateUuidParam } from "../../middlewares/uuid.middleware.js";
import {
  createCouponHandler,
  deleteCouponHandler,
  getCoupon,
  getCoupons,
  setCouponStatusHandler,
  updateCouponHandler,
} from "./coupon.controller.js";

const router = Router();
router.param("id", validateUuidParam("id"));
router.use(authenticate);

router.get(
  "/",
  requireRole(
    "SUPER_ADMIN",
    "SALON_ADMIN",
    "BRANCH_MANAGER",
    "RECEPTIONIST"
  ),
  getCoupons
);
router.post(
  "/",
  requireRole("SUPER_ADMIN", "SALON_ADMIN"),
  createCouponHandler
);
router.get(
  "/:id",
  requireRole(
    "SUPER_ADMIN",
    "SALON_ADMIN",
    "BRANCH_MANAGER",
    "RECEPTIONIST"
  ),
  getCoupon
);
router.put(
  "/:id",
  requireRole("SUPER_ADMIN", "SALON_ADMIN"),
  updateCouponHandler
);
router.patch(
  "/:id/status",
  requireRole("SUPER_ADMIN", "SALON_ADMIN"),
  setCouponStatusHandler
);
router.delete(
  "/:id",
  requireRole("SUPER_ADMIN", "SALON_ADMIN"),
  deleteCouponHandler
);

export default router;
