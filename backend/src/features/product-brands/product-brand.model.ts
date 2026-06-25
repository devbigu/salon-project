import { prisma } from "../../config/prisma.js";

const include = {
  salon: { select: { id: true, name: true } },
  _count: { select: { products: true } },
} as const;

export const ProductBrandModel = {
  create: (data: {
    salonId: string;
    name: string;
    description?: string;
    status?: boolean;
  }) => prisma.productBrand.create({ data, include }),
  list: (salonId?: string) =>
    prisma.productBrand.findMany({
      ...(salonId ? { where: { salonId } } : {}),
      include,
      orderBy: { name: "asc" },
    }),
  find: (id: string, salonId?: string) =>
    prisma.productBrand.findFirst({
      where: { id, ...(salonId ? { salonId } : {}) },
      include,
    }),
  duplicate: (salonId: string, name: string, excludeId?: string) =>
    prisma.productBrand.findFirst({
      where: { salonId, name, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    }),
  update: (
    id: string,
    data: { name?: string; description?: string | null; status?: boolean }
  ) => prisma.productBrand.update({ where: { id }, data, include }),
  remove: (id: string) => prisma.productBrand.delete({ where: { id } }),
};
