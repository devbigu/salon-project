import { prisma } from "../../config/prisma.js";

const include = {
  product: {
    include: {
      brand: { select: { id: true, name: true } },
      branch: { select: { id: true, name: true } },
    },
  },
  branch: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
} as const;

export const StockMovementModel = {
  list: (where: object) =>
    prisma.productStockMovement.findMany({
      where,
      include,
      orderBy: { createdAt: "desc" },
    }),
};
