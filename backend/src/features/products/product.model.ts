import { prisma } from "../../config/prisma.js";
import { productInclude } from "./inventory-access.js";

export const ProductModel = {
  list: (where: object) =>
    prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: { name: "asc" },
    }),
  find: (where: object) =>
    prisma.product.findFirst({ where, include: productInclude }),
  duplicate: (salonId: string, name: string, excludeId?: string) =>
    prisma.product.findFirst({
      where: { salonId, name, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    }),
  create: (data: Parameters<typeof prisma.product.create>[0]["data"]) =>
    prisma.product.create({ data, include: productInclude }),
  update: (
    id: string,
    data: Parameters<typeof prisma.product.update>[0]["data"]
  ) => prisma.product.update({ where: { id }, data, include: productInclude }),
  remove: (id: string) => prisma.product.delete({ where: { id } }),
};
