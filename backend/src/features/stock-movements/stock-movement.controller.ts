import { type Request, type Response } from "express";
import { prisma } from "../../config/prisma.js";
import {
  branchScope,
  getSalonId,
  sendInventoryError,
  transactionError,
} from "../products/inventory-access.js";
import { StockMovementModel } from "./stock-movement.model.js";

const TYPES = ["STOCK_IN", "STOCK_OUT", "RETAIL_SALE", "USED_IN_SERVICE", "DAMAGED", "ADJUSTMENT", "RETURNED"] as const;
type MovementType = (typeof TYPES)[number];
const INCREASE = new Set<MovementType>(["STOCK_IN", "RETURNED"]);
const DECREASE = new Set<MovementType>(["STOCK_OUT", "USED_IN_SERVICE", "DAMAGED"]);

const baseWhere = (req: Request) => ({
  ...(req.user?.role === "SUPER_ADMIN" ? {} : { salonId: req.user?.salonId || "__missing__" }),
  ...(req.user?.role === "RECEPTIONIST" && req.user.branchId
    ? { OR: [{ branchId: req.user.branchId }, { branchId: null }] }
    : {}),
});

export const createManualStockMovement = async (req: Request, res: Response) => {
  try {
    const salonId = getSalonId(req, req.body.salonId);
    const productId = typeof req.body.productId === "string" ? req.body.productId : "";
    const type = req.body.type as MovementType;
    const quantity = Number(req.body.quantity);
    if (!salonId || !productId || !TYPES.includes(type)) {
      return res.status(400).json({ success: false, message: "Product, salon and valid movement type are required" });
    }
    if (type === "RETAIL_SALE") {
      return res.status(400).json({ success: false, message: "RETAIL_SALE movements must be created through retail sales" });
    }
    if (!Number.isFinite(quantity) || quantity === 0 || (type !== "ADJUSTMENT" && quantity < 0)) {
      return res.status(400).json({ success: false, message: "Quantity must be positive; adjustments may be positive or negative" });
    }
    const data = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({ where: { id: productId, salonId } });
      if (!product) throw transactionError("Product not found", 404);
      const delta = type === "ADJUSTMENT"
        ? quantity
        : INCREASE.has(type)
          ? quantity
          : DECREASE.has(type)
            ? -quantity
            : 0;
      const stockBefore = Number(product.currentStock);
      const stockAfter = stockBefore + delta;
      if (stockAfter < 0) throw transactionError("Stock cannot go below zero");
      await tx.product.update({ where: { id: product.id }, data: { currentStock: stockAfter } });
      return tx.productStockMovement.create({
        data: {
          salonId,
          branchId: product.branchId,
          productId,
          type,
          quantity,
          stockBefore,
          stockAfter,
          ...(typeof req.body.reason === "string" && req.body.reason.trim() ? { reason: req.body.reason.trim() } : {}),
          ...(typeof req.body.note === "string" && req.body.note.trim() ? { note: req.body.note.trim() } : {}),
          referenceType: "MANUAL",
          ...(req.user?.userId ? { createdById: req.user.userId } : {}),
        },
      });
    });
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return sendInventoryError(res, error);
  }
};

export const getStockMovements = async (req: Request, res: Response) => {
  try {
    const type = typeof req.query.type === "string" ? req.query.type : undefined;
    if (type && !TYPES.includes(type as MovementType)) {
      return res.status(400).json({ success: false, message: "Invalid movement type" });
    }
    const from = typeof req.query.from === "string" ? new Date(req.query.from) : undefined;
    const to = typeof req.query.to === "string" ? new Date(req.query.to) : undefined;
    const data = await StockMovementModel.list({
      ...baseWhere(req),
      ...(typeof req.query.productId === "string" ? { productId: req.query.productId } : {}),
      ...(type ? { type: type as MovementType } : {}),
      ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
    });
    return res.json({ success: true, data });
  } catch (error) {
    return sendInventoryError(res, error);
  }
};

export const getProductStockMovements = async (req: Request, res: Response) => {
  try {
    const productId = typeof req.params.productId === "string" ? req.params.productId : "";
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        ...(req.user?.role === "SUPER_ADMIN" ? {} : { salonId: req.user?.salonId || "__missing__" }),
        ...branchScope(req),
      },
      select: { id: true },
    });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    const data = await StockMovementModel.list({ ...baseWhere(req), productId });
    return res.json({ success: true, data });
  } catch (error) {
    return sendInventoryError(res, error);
  }
};
