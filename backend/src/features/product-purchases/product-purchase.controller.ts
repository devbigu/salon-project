import { type Request, type Response } from "express";
import { prisma } from "../../config/prisma.js";
import {
  getSalonId,
  sendInventoryError,
  transactionError,
  validateBranch,
} from "../products/inventory-access.js";
import { ProductPurchaseModel } from "./product-purchase.model.js";

type PurchaseItem = { productId: string; quantity: number; unitCost: number };
const idParam = (req: Request) => typeof req.params.id === "string" ? req.params.id : "";
const listWhere = (req: Request) => ({
  ...(req.user?.role === "SUPER_ADMIN"
    ? typeof req.query.salonId === "string"
      ? { salonId: req.query.salonId }
      : {}
    : { salonId: req.user?.salonId || "__missing__" }),
  ...((req.user?.role === "RECEPTIONIST" || req.user?.role === "BRANCH_MANAGER") && req.user.branchId
    ? { branchId: req.user.branchId }
    : {}),
  ...(typeof req.query.vendorId === "string" ? { vendorId: req.query.vendorId } : {}),
});

export const createProductPurchase = async (req: Request, res: Response) => {
  try {
    const salonId = getSalonId(req, req.body.salonId);
    const branchId = typeof req.body.branchId === "string" && req.body.branchId ? req.body.branchId : undefined;
    const vendorId = typeof req.body.vendorId === "string" && req.body.vendorId ? req.body.vendorId : undefined;
    if (!salonId) return res.status(400).json({ success: false, message: "Salon is required" });
    if (!(await validateBranch(salonId, branchId))) {
      return res.status(400).json({ success: false, message: "Invalid branch for this salon" });
    }
    const purchaseDate = req.body.purchaseDate ? new Date(req.body.purchaseDate) : undefined;
    if (purchaseDate && Number.isNaN(purchaseDate.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid purchase date" });
    }
    if (!Array.isArray(req.body.items) || req.body.items.length === 0) {
      return res.status(400).json({ success: false, message: "At least one purchase item is required" });
    }
    const items: PurchaseItem[] = req.body.items.map((item: Record<string, unknown>) => ({
      productId: typeof item.productId === "string" ? item.productId : "",
      quantity: Number(item.quantity),
      unitCost: Number(item.unitCost),
    }));
    if (items.some((item) => !item.productId || !Number.isFinite(item.quantity) || item.quantity <= 0 || !Number.isFinite(item.unitCost) || item.unitCost < 0)) {
      return res.status(400).json({ success: false, message: "Purchase quantities must be positive and unit costs non-negative" });
    }
    if (new Set(items.map((item) => item.productId)).size !== items.length) {
      return res.status(400).json({ success: false, message: "Each product may appear only once per purchase" });
    }

    const data = await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { id: { in: items.map((item) => item.productId) }, salonId },
      });
      if (products.length !== items.length) throw transactionError("One or more products were not found", 404);
      if (branchId && products.some((product) => product.branchId && product.branchId !== branchId)) {
        throw transactionError("A product does not belong to the selected branch");
      }
      const vendor = vendorId
        ? await tx.vendor.findFirst({ where: { id: vendorId, salonId }, select: { id: true, name: true, phone: true, status: true } })
        : null;
      if (vendorId && !vendor) throw transactionError("Vendor not found", 404);
      if (vendor && !vendor.status) throw transactionError("Vendor is inactive");
      const total = items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
      const purchase = await tx.productPurchase.create({
        data: {
          purchaseCode: `PUR-${Date.now()}`,
          salonId,
          ...(branchId ? { branchId } : {}),
          ...(vendorId ? { vendorId } : {}),
          ...(typeof req.body.supplierName === "string" && req.body.supplierName.trim() ? { supplierName: req.body.supplierName.trim() } : vendor?.name ? { supplierName: vendor.name } : {}),
          ...(typeof req.body.supplierPhone === "string" && req.body.supplierPhone.trim() ? { supplierPhone: req.body.supplierPhone.trim() } : vendor?.phone ? { supplierPhone: vendor.phone } : {}),
          ...(typeof req.body.invoiceNo === "string" && req.body.invoiceNo.trim() ? { invoiceNo: req.body.invoiceNo.trim() } : {}),
          ...(purchaseDate ? { purchaseDate } : {}),
          ...(typeof req.body.note === "string" && req.body.note.trim() ? { note: req.body.note.trim() } : {}),
          subtotalAmount: total,
          totalAmount: total,
          paidAmount: 0,
          balanceAmount: total,
          paymentStatus: "UNPAID",
          ...(req.user?.userId ? { createdById: req.user.userId } : {}),
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitCost: item.unitCost,
              totalCost: item.quantity * item.unitCost,
            })),
          },
        },
      });
      for (const item of items) {
        const updated = await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { increment: item.quantity }, costPrice: item.unitCost },
        });
        const stockAfter = Number(updated.currentStock);
        await tx.productStockMovement.create({
          data: {
            salonId,
            branchId: branchId ?? updated.branchId,
            productId: item.productId,
            type: "STOCK_IN",
            quantity: item.quantity,
            stockBefore: stockAfter - item.quantity,
            stockAfter,
            referenceType: "PRODUCT_PURCHASE",
            referenceId: purchase.id,
            ...(req.user?.userId ? { createdById: req.user.userId } : {}),
          },
        });
      }
      return purchase.id;
    });
    const purchase = await ProductPurchaseModel.find({ id: data, salonId });
    return res.status(201).json({ success: true, data: purchase });
  } catch (error) {
    return sendInventoryError(res, error);
  }
};

export const getProductPurchases = async (req: Request, res: Response) => {
  try {
    const data = await ProductPurchaseModel.list(listWhere(req));
    return res.json({ success: true, data });
  } catch (error) {
    return sendInventoryError(res, error);
  }
};

export const getProductPurchase = async (req: Request, res: Response) => {
  try {
    const data = await ProductPurchaseModel.find({ id: idParam(req), ...listWhere(req) });
    if (!data) return res.status(404).json({ success: false, message: "Product purchase not found" });
    return res.json({ success: true, data });
  } catch (error) {
    return sendInventoryError(res, error);
  }
};
