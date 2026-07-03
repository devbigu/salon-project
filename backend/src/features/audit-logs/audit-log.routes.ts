import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";
import { validateUuidParam } from "../../middlewares/uuid.middleware.js";
import { getAuditLog, getAuditLogs } from "./audit-log.controller.js";

const router = Router();
router.param("id", validateUuidParam("id"));
router.use(authenticate);
router.use(requireRole("SUPER_ADMIN", "SALON_ADMIN", "BRANCH_MANAGER"));
router.get("/", getAuditLogs);
router.get("/:id", getAuditLog);

export default router;
