import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";
import { validateUuidParam } from "../../middlewares/uuid.middleware.js";
import {
  approveReorderSuggestion,
  convertReorderSuggestionToPurchase,
  getPendingReorderSuggestions,
  getReorderSuggestion,
  getReorderSuggestions,
  rejectReorderSuggestion,
} from "./reorder-suggestion.controller.js";

const router = Router();
router.param("id", validateUuidParam("id"));
router.use(authenticate);

router.get(
  "/pending",
  requireRole(
    "SUPER_ADMIN",
    "SALON_ADMIN",
    "BRANCH_MANAGER",
    "RECEPTIONIST",
    "STAFF"
  ),
  getPendingReorderSuggestions
);
router.get(
  "/",
  requireRole(
    "SUPER_ADMIN",
    "SALON_ADMIN",
    "BRANCH_MANAGER",
    "RECEPTIONIST",
    "STAFF"
  ),
  getReorderSuggestions
);
router.get(
  "/:id",
  requireRole(
    "SUPER_ADMIN",
    "SALON_ADMIN",
    "BRANCH_MANAGER",
    "RECEPTIONIST",
    "STAFF"
  ),
  getReorderSuggestion
);
router.patch(
  "/:id/approve",
  requireRole("SUPER_ADMIN", "SALON_ADMIN"),
  approveReorderSuggestion
);
router.patch(
  "/:id/reject",
  requireRole("SUPER_ADMIN", "SALON_ADMIN"),
  rejectReorderSuggestion
);
router.post(
  "/:id/convert-to-purchase",
  requireRole("SUPER_ADMIN", "SALON_ADMIN"),
  convertReorderSuggestionToPurchase
);

export default router;
