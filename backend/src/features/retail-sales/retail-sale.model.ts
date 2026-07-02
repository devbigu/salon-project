import { prisma } from "../../config/prisma.js";

const include = {
  branch: { select: { id: true, name: true } },
  salon: { select: { id: true, name: true } },
  customer: { select: { id: true, name: true, phone: true } },
  createdBy: { select: { id: true, name: true } },
  staff: { select: { id: true, staffCode: true, name: true, jobRole: true } },
  items: {
    include: {
      product: { include: { brand: { select: { id: true, name: true } } } },
    },
  },
} as const;

export const RetailSaleModel = {
  list: (where: object) =>
    prisma.retailSale.findMany({ where, include, orderBy: { saleDate: "desc" } }),
  find: (where: object) => prisma.retailSale.findFirst({ where, include }),
};
