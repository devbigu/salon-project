import { prisma } from "../config/prisma.js";

beforeEach(async () => {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "SupportTicketStatusHistory",
      "SupportTicketMessage",
      "SupportTicket",
      "UserSession",
      "Payment",
      "InvoiceItem",
      "Invoice",
      "SalePayment",
      "SaleItem",
      "Sale",
      "CustomerTransaction",
      "AppointmentStatusHistory",
      "AppointmentService",
      "Appointment",
      "ServiceConsumable",
      "StaffAttendance",
      "StaffLeave",
      "SalarySlip",
      "StaffSalaryConfig",
      "Service",
      "MainService",
      "Staff",
      "Customer",
      "User",
      "Branch",
      "Salon"
    RESTART IDENTITY CASCADE
  `);
});

afterAll(async () => {
  await prisma.$disconnect();
});
