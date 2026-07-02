import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";
import {
  createProductBrand,
  deleteProductBrand,
  getProductBrand,
  getProductBrands,
  setProductBrandStatus,
  updateProductBrand,
} from "./product-brand.controller.js";

import { validateUuidParam } from "../../middlewares/uuid.middleware.js";

const router = Router();
router.param("id", validateUuidParam("id"));
router.use(authenticate);
router.post("/", requireRole("SUPER_ADMIN", "SALON_ADMIN"), createProductBrand);
router.get("/", requireRole("SUPER_ADMIN", "SALON_ADMIN", "BRANCH_MANAGER", "RECEPTIONIST", "STAFF"), getProductBrands);
router.patch("/:id/status", requireRole("SUPER_ADMIN", "SALON_ADMIN"), setProductBrandStatus);
router.get("/:id", requireRole("SUPER_ADMIN", "SALON_ADMIN", "BRANCH_MANAGER", "RECEPTIONIST", "STAFF"), getProductBrand);
router.put("/:id", requireRole("SUPER_ADMIN", "SALON_ADMIN"), updateProductBrand);
router.delete("/:id", requireRole("SUPER_ADMIN", "SALON_ADMIN"), deleteProductBrand);
export default router;
