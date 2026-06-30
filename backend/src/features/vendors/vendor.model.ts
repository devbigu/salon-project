import { prisma } from "../../config/prisma.js";

const include = {
  salon: { select: { id: true, name: true } },
  _count: {
    select: {
      products: true,
      productPurchases: true,
      vendorPayments: true,
      expenses: true,
    },
  },
} as const;

export const VendorModel = {
  list: (where: object) =>
    prisma.vendor.findMany({ where, include, orderBy: { name: "asc" } }),
  find: (where: object) => prisma.vendor.findFirst({ where, include }),
  duplicate: (salonId: string, name: string, excludeId?: string) =>
    prisma.vendor.findFirst({
      where: {
        salonId,
        name: { equals: name, mode: "insensitive" },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    }),
  create: (data: Parameters<typeof prisma.vendor.create>[0]["data"]) =>
    prisma.vendor.create({ data, include }),
  update: (
    id: string,
    data: Parameters<typeof prisma.vendor.update>[0]["data"]
  ) => prisma.vendor.update({ where: { id }, data, include }),
  remove: (id: string) => prisma.vendor.delete({ where: { id } }),
};
