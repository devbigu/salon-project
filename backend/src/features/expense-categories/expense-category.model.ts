import { prisma } from "../../config/prisma.js";

const include = {
  salon: { select: { id: true, name: true } },
  _count: { select: { expenses: true } },
} as const;

export const ExpenseCategoryModel = {
  list: (where: object) =>
    prisma.expenseCategoryDefinition.findMany({
      where,
      include,
      orderBy: { name: "asc" },
    }),
  find: (where: object) =>
    prisma.expenseCategoryDefinition.findFirst({ where, include }),
  duplicate: (salonId: string, name: string, excludeId?: string) =>
    prisma.expenseCategoryDefinition.findFirst({
      where: {
        salonId,
        name: { equals: name, mode: "insensitive" },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    }),
  create: (data: { salonId: string; name: string }) =>
    prisma.expenseCategoryDefinition.create({ data, include }),
  update: (id: string, data: { name?: string; status?: boolean }) =>
    prisma.expenseCategoryDefinition.update({ where: { id }, data, include }),
  remove: (id: string) =>
    prisma.expenseCategoryDefinition.delete({ where: { id } }),
};
