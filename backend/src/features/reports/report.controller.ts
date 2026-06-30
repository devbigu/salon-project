import { type Request, type Response } from "express";
import { prisma } from "../../config/prisma.js";
import {
  branchScope,
  getSalonId,
  sendInventoryError,
  transactionError,
  validateBranch,
} from "../products/inventory-access.js";
import { ReportModel } from "./report.model.js";

const resolveScope = async (req: Request) => {
  let salonId = getSalonId(req, req.query.salonId);
  const restrictedBranch =
    (req.user?.role === "BRANCH_MANAGER" ||
      req.user?.role === "RECEPTIONIST") &&
    req.user.branchId
      ? req.user.branchId
      : undefined;
  const branchId =
    restrictedBranch ??
    (typeof req.query.branchId === "string" ? req.query.branchId : undefined);

  if (req.user?.role !== "SUPER_ADMIN" && !salonId) {
    throw transactionError("Salon is required");
  }
  if (branchId && !salonId && req.user?.role === "SUPER_ADMIN") {
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: { salonId: true },
    });
    if (!branch) throw transactionError("Branch not found", 404);
    salonId = branch.salonId;
  }
  if (salonId && !(await validateBranch(salonId, branchId))) {
    throw transactionError("Invalid branch for this salon");
  }
  return { salonId, branchId };
};

const dateRange = (req: Request) => {
  const from =
    typeof req.query.from === "string" ? new Date(req.query.from) : undefined;
  const to =
    typeof req.query.to === "string" ? new Date(req.query.to) : undefined;
  if (
    (from && Number.isNaN(from.getTime())) ||
    (to && Number.isNaN(to.getTime()))
  ) {
    throw transactionError("Invalid date range");
  }
  return from || to
    ? { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) }
    : undefined;
};

const numberSum = (value: unknown) => Number(value ?? 0);

export const getInventoryReport = async (req: Request, res: Response) => {
  try {
    const { salonId, branchId } = await resolveScope(req);
    const products = await ReportModel.products({
      ...(salonId ? { salonId } : {}),
      ...(branchId
        ? { OR: [{ branchId }, { branchId: null }] }
        : req.user?.role === "BRANCH_MANAGER" ||
            req.user?.role === "RECEPTIONIST"
          ? branchScope(req)
          : {}),
    });
    const data = products.reduce(
      (report, product) => {
        const stock = Number(product.currentStock);
        report.totalStockQuantity += stock;
        report.totalStockCostValue += stock * Number(product.costPrice);
        report.totalRetailValue += stock * Number(product.sellingPrice);
        if (
          product.status &&
          Number(product.lowStockAlert) > 0 &&
          stock <= Number(product.lowStockAlert)
        ) {
          report.lowStockCount += 1;
        }
        return report;
      },
      {
        totalProducts: products.length,
        totalStockQuantity: 0,
        totalStockCostValue: 0,
        totalRetailValue: 0,
        lowStockCount: 0,
      }
    );
    return res.json({ success: true, data });
  } catch (error) {
    return sendInventoryError(res, error);
  }
};

export const getExpenseReport = async (req: Request, res: Response) => {
  try {
    const { salonId, branchId } = await resolveScope(req);
    const range = dateRange(req);
    const expenses = await ReportModel.expenses({
      ...(salonId ? { salonId } : {}),
      ...(branchId ? { branchId } : {}),
      ...(range ? { expenseDate: range } : {}),
    });
    const categoryTotals = new Map<string, number>();
    const monthTotals = new Map<string, number>();
    const branchTotals = new Map<string, { branchId: string | null; total: number }>();
    let totalExpenses = 0;
    for (const expense of expenses) {
      const amount = Number(expense.amount);
      totalExpenses += amount;
      categoryTotals.set(
        expense.category,
        (categoryTotals.get(expense.category) ?? 0) + amount
      );
      const month = expense.expenseDate.toISOString().slice(0, 7);
      monthTotals.set(month, (monthTotals.get(month) ?? 0) + amount);
      const branchName = expense.branch?.name ?? "All branches";
      const current = branchTotals.get(branchName);
      branchTotals.set(branchName, {
        branchId: expense.branchId,
        total: (current?.total ?? 0) + amount,
      });
    }
    return res.json({
      success: true,
      data: {
        totalExpenses,
        expensesByCategory: Array.from(categoryTotals, ([category, total]) => ({
          category,
          total,
        })),
        expensesByMonth: Array.from(monthTotals, ([month, total]) => ({
          month,
          total,
        })),
        expensesByBranch: Array.from(branchTotals, ([branch, value]) => ({
          branch,
          ...value,
        })),
      },
    });
  } catch (error) {
    return sendInventoryError(res, error);
  }
};

export const getProfitSummary = async (req: Request, res: Response) => {
  try {
    const { salonId, branchId } = await resolveScope(req);
    const range = dateRange(req);
    const common = {
      ...(salonId ? { salonId } : {}),
      ...(branchId ? { branchId } : {}),
    };
    const [payments, sales, retailSales, purchases, expenses] =
      await Promise.all([
        prisma.payment.aggregate({
          where: { ...common, ...(range ? { paidAt: range } : {}) },
          _sum: { amount: true },
        }),
        prisma.sale.aggregate({
          where: {
            ...common,
            status: "ACTIVE",
            ...(range ? { saleDate: range } : {}),
          },
          _sum: { totalAmount: true },
        }),
        prisma.retailSale.aggregate({
          where: { ...common, ...(range ? { saleDate: range } : {}) },
          _sum: { totalAmount: true },
        }),
        prisma.productPurchase.aggregate({
          where: { ...common, ...(range ? { purchaseDate: range } : {}) },
          _sum: { totalAmount: true },
        }),
        prisma.expense.aggregate({
          where: { ...common, ...(range ? { expenseDate: range } : {}) },
          _sum: { amount: true },
        }),
      ]);
    const serviceRevenue = numberSum(payments._sum.amount);
    const saleRevenue = numberSum(sales._sum.totalAmount);
    const retailSalesTotal = numberSum(retailSales._sum.totalAmount);
    const productPurchaseCost = numberSum(purchases._sum.totalAmount);
    const expensesTotal = numberSum(expenses._sum.amount);
    const estimatedProfit =
      serviceRevenue +
      saleRevenue +
      retailSalesTotal -
      productPurchaseCost -
      expensesTotal;
    return res.json({
      success: true,
      data: {
        serviceRevenue,
        saleRevenue,
        retailSalesTotal,
        productPurchaseCost,
        expensesTotal,
        estimatedProfit,
      },
    });
  } catch (error) {
    return sendInventoryError(res, error);
  }
};
