import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";
import { createRetailSale, getRetailSale, getRetailSales } from "./retail-sale.controller.js";

const router = Router();
router.use(authenticate);
router.post("/", requireRole("SUPER_ADMIN", "SALON_ADMIN", "RECEPTIONIST"), createRetailSale);
router.get("/", requireRole("SUPER_ADMIN", "SALON_ADMIN", "RECEPTIONIST", "STAFF"), getRetailSales);
router.get("/:id", requireRole("SUPER_ADMIN", "SALON_ADMIN", "RECEPTIONIST", "STAFF"), getRetailSale);
export default router;
