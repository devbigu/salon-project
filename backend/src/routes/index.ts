import { Router } from "express";

import authRoutes from "../features/auth/auth.routes.js";
import userRoutes from "../features/users/user.routes.js";
import salonRoutes from "../features/salons/salon.routes.js";
import branchRoutes from "../features/branches/branch.routes.js";
import staffRoutes from "../features/staff/staff.routes.js";
import customerRoutes from "../features/customers/customer.routes.js";
import mainServiceRoutes from "../features/main-services/mainService.routes.js";
import serviceRoutes from "../features/services/service.routes.js";
import appointmentRoutes from "../features/appointments/appointment.routes.js";
import invoiceRoutes from "../features/Invoices/invoice.routes.js";
import paymentRoutes from "../features/Payments/payment.routes.js";
import supportTicketRoutes from "../features/support-tickets/supportTicket.routes.js";



const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/salons", salonRoutes);
router.use("/branches", branchRoutes);
router.use("/staff", staffRoutes);
router.use("/customers", customerRoutes);
router.use("/main-services", mainServiceRoutes);
router.use("/services", serviceRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/invoices", invoiceRoutes)
router.use("/payments", paymentRoutes)
router.use("/support-tickets", supportTicketRoutes);


export default router;
