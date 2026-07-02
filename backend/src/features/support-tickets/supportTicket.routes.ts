import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";
import { publicSupportRateLimiter } from "../../middlewares/rate-limit.middleware.js";
import {
  addTicketMessage,
  assignTicket,
  createPublicTicket,
  createTicket,
  getMyTickets,
  getPublicTicketByCode,
  getTicketById,
  getTickets,
  updateTicketStatus,
} from "./supportTicket.controller.js";

import { validateUuidParam } from "../../middlewares/uuid.middleware.js";

const router = Router();
router.param("id", validateUuidParam("id"));
const ticketUserRoles = [
  "SUPER_ADMIN",
  "SALON_ADMIN",
  "RECEPTIONIST",
  "STAFF",
] as const;

router.post("/public", publicSupportRateLimiter, createPublicTicket);
router.get("/public/:ticketCode", getPublicTicketByCode);

router.post(
  "/",
  authenticate,
  requireRole(...ticketUserRoles),
  createTicket
);
router.get("/", authenticate, requireRole("SUPER_ADMIN"), getTickets);
router.get(
  "/my",
  authenticate,
  requireRole(...ticketUserRoles),
  getMyTickets
);

router.patch(
  "/:id/status",
  authenticate,
  requireRole("SUPER_ADMIN"),
  updateTicketStatus
);
router.patch(
  "/:id/assign",
  authenticate,
  requireRole("SUPER_ADMIN"),
  assignTicket
);
router.post(
  "/:id/messages",
  authenticate,
  requireRole(...ticketUserRoles),
  addTicketMessage
);
router.get(
  "/:id",
  authenticate,
  requireRole(...ticketUserRoles),
  getTicketById
);

export default router;
