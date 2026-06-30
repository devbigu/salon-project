import { prisma } from "../../config/prisma.js";

const include = {
  branch: { select: { id: true, name: true } },
  salon: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
  vendor: { select: { id: true, name: true, phone: true } },
  vendorPayments: {
    select: {
      id: true,
      amount: true,
      paymentMethod: true,
      paymentDate: true,
    },
    orderBy: { paymentDate: "desc" },
  },
  items: {
    include: {
      product: { include: { brand: { select: { id: true, name: true } } } },
    },
  },
} as const;

export const ProductPurchaseModel = {
  list: (where: object) =>
    prisma.productPurchase.findMany({
      where,
      include,
      orderBy: { purchaseDate: "desc" },
    }),
  find: (where: object) => prisma.productPurchase.findFirst({ where, include }),
};
