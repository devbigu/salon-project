import { Router } from "express";
import {
  createBranch,
  getBranches,
} from "./branch.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  requireRole("SUPER_ADMIN", "SALON_ADMIN"),
  createBranch
);

router.get(
  "/",
  requireRole("SUPER_ADMIN", "SALON_ADMIN"),
  getBranches
);

export default router;
