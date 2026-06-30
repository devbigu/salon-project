import { prisma } from "../../config/prisma.js";

export const ReportModel = {
  products: (where: object) =>
    prisma.product.findMany({
      where,
      select: {
        currentStock: true,
        lowStockAlert: true,
        costPrice: true,
        sellingPrice: true,
        status: true,
      },
    }),
  expenses: (where: object) =>
    prisma.expense.findMany({
      where,
      select: {
        amount: true,
        category: true,
        expenseDate: true,
        branchId: true,
        branch: { select: { name: true } },
      },
      orderBy: { expenseDate: "asc" },
    }),
};
