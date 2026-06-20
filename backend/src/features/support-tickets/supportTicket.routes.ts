import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";
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

const router = Router();
const ticketUserRoles = [
  "SUPER_ADMIN",
  "SALON_ADMIN",
  "RECEPTIONIST",
  "STAFF",
] as const;

router.post("/public", createPublicTicket);
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
