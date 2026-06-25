import { type Request, type Response } from "express";
import { prisma } from "../../config/prisma.js";
import {
  getSalonId,
  sendInventoryError,
  transactionError,
  validateBranch,
} from "../products/inventory-access.js";
import { RetailSaleModel } from "./retail-sale.model.js";

const PAYMENT_METHODS = ["CASH", "UPI", "GPAY", "PAYTM", "PHONEPE", "CARD", "BANK_TRANSFER", "CHEQUE", "OTHER"] as const;
type PaymentMethod = (typeof PAYMENT_METHODS)[number];
type SaleItem = { productId: string; quantity: number; unitPrice: number };
const idParam = (req: Request) => typeof req.params.id === "string" ? req.params.id : "";
const listWhere = (req: Request) => ({
  ...(req.user?.role === "SUPER_ADMIN" ? {} : { salonId: req.user?.salonId || "__missing__" }),
  ...(req.user?.role === "RECEPTIONIST" && req.user.branchId ? { branchId: req.user.branchId } : {}),
});

export const createRetailSale = async (req: Request, res: Response) => {
  try {
    const salonId = getSalonId(req, req.body.salonId);
    const branchId =
      req.user?.role === "RECEPTIONIST"
        ? req.user.branchId
        : typeof req.body.branchId === "string" && req.body.branchId
          ? req.body.branchId
          : undefined;
    if (!salonId) return res.status(400).json({ success: false, message: "Salon is required" });
    if (!(await validateBranch(salonId, branchId))) return res.status(400).json({ success: false, message: "Invalid branch for this salon" });
    if (req.body.paymentMethod && !PAYMENT_METHODS.includes(req.body.paymentMethod as PaymentMethod)) {
      return res.status(400).json({ success: false, message: "Invalid payment method" });
    }
    if (!Array.isArray(req.body.items) || req.body.items.length === 0) {
      return res.status(400).json({ success: false, message: "At least one retail sale item is required" });
    }
    const items: SaleItem[] = req.body.items.map((item: Record<string, unknown>) => ({
      productId: typeof item.productId === "string" ? item.productId : "",
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
    }));
    if (items.some((item) => !item.productId || !Number.isFinite(item.quantity) || item.quantity <= 0 || !Number.isFinite(item.unitPrice) || item.unitPrice < 0)) {
      return res.status(400).json({ success: false, message: "Sale quantities must be positive and prices non-negative" });
    }
    if (new Set(items.map((item) => item.productId)).size !== items.length) {
      return res.status(400).json({ success: false, message: "Each product may appear only once per sale" });
    }
    const discount = Number(req.body.discountAmount ?? 0);
    if (!Number.isFinite(discount) || discount < 0) return res.status(400).json({ success: false, message: "Discount must be non-negative" });

    const saleId = await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { id: { in: items.map((item) => item.productId) }, salonId },
      });
      if (products.length !== items.length) throw transactionError("One or more products were not found", 404);
      if (products.some((product) => !product.status)) throw transactionError("Inactive products cannot be sold");
      if (products.some((product) => !product.isRetailProduct)) throw transactionError("Only retail products can be sold");
      if (branchId && products.some((product) => product.branchId && product.branchId !== branchId)) {
        throw transactionError("A product does not belong to the selected branch");
      }
      if (req.body.customerId) {
        const customer = await tx.customer.findFirst({ where: { id: req.body.customerId, salonId }, select: { id: true } });
        if (!customer) throw transactionError("Customer not found", 404);
      }
      const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      if (discount > subtotal) throw transactionError("Discount cannot exceed subtotal");
      const sale = await tx.retailSale.create({
        data: {
          saleCode: `RET-${Date.now()}`,
          salonId,
          ...(branchId ? { branchId } : {}),
          ...(req.body.customerId ? { customerId: req.body.customerId } : {}),
          subtotalAmount: subtotal,
          discountAmount: discount,
          totalAmount: subtotal - discount,
          ...(req.body.paymentMethod ? { paymentMethod: req.body.paymentMethod as PaymentMethod } : {}),
          ...(typeof req.body.note === "string" && req.body.note.trim() ? { note: req.body.note.trim() } : {}),
          ...(req.user?.userId ? { createdById: req.user.userId } : {}),
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice,
            })),
          },
        },
      });
      for (const item of items) {
        const changed = await tx.product.updateMany({
          where: { id: item.productId, salonId, status: true, currentStock: { gte: item.quantity } },
          data: { currentStock: { decrement: item.quantity } },
        });
        if (changed.count !== 1) throw transactionError("Insufficient stock for one or more products");
        const updated = await tx.product.findUniqueOrThrow({ where: { id: item.productId } });
        const stockAfter = Number(updated.currentStock);
        await tx.productStockMovement.create({
          data: {
            salonId,
            branchId: branchId ?? updated.branchId,
            productId: item.productId,
            type: "RETAIL_SALE",
            quantity: item.quantity,
            stockBefore: stockAfter + item.quantity,
            stockAfter,
            referenceType: "RETAIL_SALE",
            referenceId: sale.id,
            ...(req.user?.userId ? { createdById: req.user.userId } : {}),
          },
        });
      }
      return sale.id;
    });
    const data = await RetailSaleModel.find({ id: saleId, salonId });
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return sendInventoryError(res, error);
  }
};

export const getRetailSales = async (req: Request, res: Response) => {
  try {
    const data = await RetailSaleModel.list(listWhere(req));
    return res.json({ success: true, data });
  } catch (error) {
    return sendInventoryError(res, error);
  }
};

export const getRetailSale = async (req: Request, res: Response) => {
  try {
    const data = await RetailSaleModel.find({ id: idParam(req), ...listWhere(req) });
    if (!data) return res.status(404).json({ success: false, message: "Retail sale not found" });
    return res.json({ success: true, data });
  } catch (error) {
    return sendInventoryError(res, error);
  }
};
