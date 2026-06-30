import { prisma } from "../../config/prisma.js";

const include = {
  salon: { select: { id: true, name: true } },
  branch: { select: { id: true, name: true } },
  vendor: { select: { id: true, name: true } },
  categoryDefinition: { select: { id: true, name: true, status: true } },
  createdBy: { select: { id: true, name: true } },
} as const;

export const ExpenseModel = {
  list: (where: object) =>
    prisma.expense.findMany({
      where,
      include,
      orderBy: { expenseDate: "desc" },
    }),
  find: (where: object) => prisma.expense.findFirst({ where, include }),
  create: (data: Parameters<typeof prisma.expense.create>[0]["data"]) =>
    prisma.expense.create({ data, include }),
  update: (
    id: string,
    data: Parameters<typeof prisma.expense.update>[0]["data"]
  ) => prisma.expense.update({ where: { id }, data, include }),
  remove: (id: string) => prisma.expense.delete({ where: { id } }),
};
