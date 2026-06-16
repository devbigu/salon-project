import { Router } from "express";
import {
  createBranch,
  deleteBranch,
  getBranchById,
  getBranches,
  updateBranch,
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

router.get(
  "/:id",
  requireRole("SUPER_ADMIN", "SALON_ADMIN"),
  getBranchById
);

router.put(
  "/:id",
  requireRole("SUPER_ADMIN", "SALON_ADMIN"),
  updateBranch
);

router.delete(
  "/:id",
  requireRole("SUPER_ADMIN", "SALON_ADMIN"),
  deleteBranch
);

export default router;
