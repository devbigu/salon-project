import { prisma } from "../../config/prisma.js";

const include = {
  branch: { select: { id: true, name: true } },
  salon: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
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
