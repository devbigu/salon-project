import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";
import {
  createProductPurchase,
  getProductPurchase,
  getProductPurchases,
} from "./product-purchase.controller.js";

const router = Router();
router.use(authenticate);
router.post("/", requireRole("SUPER_ADMIN", "SALON_ADMIN"), createProductPurchase);
router.get("/", requireRole("SUPER_ADMIN", "SALON_ADMIN", "RECEPTIONIST", "STAFF"), getProductPurchases);
router.get("/:id", requireRole("SUPER_ADMIN", "SALON_ADMIN", "RECEPTIONIST", "STAFF"), getProductPurchase);
export default router;
