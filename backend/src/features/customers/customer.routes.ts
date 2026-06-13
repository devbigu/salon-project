import { Router } from "express";
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from "./customer.controller.js";

import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";


const router = Router();

router.use(authenticate);
router.post("/", requireRole("SUPER_ADMIN", "SALON_ADMIN", "STAFF"), createCustomer);

router.get("/", requireRole("SUPER_ADMIN", "SALON_ADMIN", "STAFF"), getCustomers);

router.get("/:id", requireRole("SUPER_ADMIN", "SALON_ADMIN", "STAFF"), getCustomerById);

router.put("/:id", requireRole("SUPER_ADMIN", "SALON_ADMIN", "STAFF"), updateCustomer);

router.delete("/:id", requireRole("SUPER_ADMIN", "SALON_ADMIN"), deleteCustomer);

export default router;