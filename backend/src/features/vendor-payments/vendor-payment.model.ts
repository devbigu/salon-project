import { prisma } from "../../config/prisma.js";

const include = {
  salon: { select: { id: true, name: true } },
  branch: { select: { id: true, name: true } },
  vendor: { select: { id: true, name: true } },
  purchase: {
    select: {
      id: true,
      purchaseCode: true,
      totalAmount: true,
      paidAmount: true,
      balanceAmount: true,
      paymentStatus: true,
    },
  },
  createdBy: { select: { id: true, name: true } },
} as const;

export const VendorPaymentModel = {
  list: (where: object) =>
    prisma.vendorPayment.findMany({
      where,
      include,
      orderBy: { paymentDate: "desc" },
    }),
  find: (where: object) => prisma.vendorPayment.findFirst({ where, include }),
};
