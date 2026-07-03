import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";
import { getLoyaltyTransactions } from "./loyalty.controller.js";

const router = Router();

router.use(authenticate);
router.get(
  "/",
  requireRole(
    "SUPER_ADMIN",
    "SALON_ADMIN",
    "BRANCH_MANAGER",
    "RECEPTIONIST"
  ),
  getLoyaltyTransactions
);

export default router;
