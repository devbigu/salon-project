import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";
import {
  createManualStockMovement,
  getProductStockMovements,
  getStockMovements,
} from "./stock-movement.controller.js";

import { validateUuidParam } from "../../middlewares/uuid.middleware.js";

const router = Router();
router.param("productId", validateUuidParam("productId"));
router.use(authenticate);
router.post("/manual", requireRole("SUPER_ADMIN", "SALON_ADMIN"), createManualStockMovement);
router.get("/", requireRole("SUPER_ADMIN", "SALON_ADMIN", "BRANCH_MANAGER", "RECEPTIONIST", "STAFF"), getStockMovements);
router.get("/product/:productId", requireRole("SUPER_ADMIN", "SALON_ADMIN", "BRANCH_MANAGER", "RECEPTIONIST", "STAFF"), getProductStockMovements);
export default router;
