import { Router } from "express";
import { getUsers, createSalonAdmin, } from "./user.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";
const router = Router();
router.use(authenticate);
router.get("/", requireRole("SUPER_ADMIN"), getUsers);
router.post("/salon-admin", requireRole("SUPER_ADMIN"), createSalonAdmin);
export default router;
//# sourceMappingURL=user.routes.js.map