import { Router } from "express";
import { createStaff, getStaff, } from "../controllers/staff.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/rbac.middleware.js";
const router = Router();
router.use(authenticate);
router.post("/", requireRole("SUPER_ADMIN", "SALON_ADMIN"), createStaff);
router.get("/", requireRole("SUPER_ADMIN", "SALON_ADMIN"), getStaff);
export default router;
//# sourceMappingURL=staff.routes.js.map