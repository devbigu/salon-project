import { prisma } from "../config/prisma.js";

beforeEach(async () => {
  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.salePayment.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.customerTransaction.deleteMany();
  await prisma.appointmentStatusHistory.deleteMany();
  await prisma.appointmentService.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.service.deleteMany();
  await prisma.mainService.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.salon.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
