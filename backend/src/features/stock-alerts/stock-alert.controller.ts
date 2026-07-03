import { type Request, type Response } from "express";
import { prisma } from "../../config/prisma.js";
import {
  Prisma,
  type StockAlertStatus,
} from "../../generated/prisma/client.js";
import { parsePagination, paginationMeta } from "../../utils/pagination.js";
import { branchScope, sendInventoryError } from "../products/inventory-access.js";

const STATUSES = ["OPEN", "RESOLVED"] as const;

const accessWhere = (req: Request): Prisma.StockAlertWhereInput => ({
  ...(req.user?.role === "SUPER_ADMIN"
    ? typeof req.query.salonId === "string"
      ? { salonId: req.query.salonId }
      : {}
    : { salonId: req.user?.salonId ?? "__missing__" }),
  ...branchScope(req),
});

const alertInclude = {
  product: {
    select: { id: true, name: true, sku: true, unit: true },
  },
  branch: { select: { id: true, name: true } },
} as const;

const listAlerts = async (
  req: Request,
  res: Response,
  forcedStatus?: StockAlertStatus
) => {
  try {
    const pagination = parsePagination(req.query);
    if ("error" in pagination) {
      return res.status(400).json({ success: false, message: pagination.error });
    }
    const status =
      forcedStatus ??
      (typeof req.query.status === "string"
        ? req.query.status.toUpperCase()
        : undefined);
    if (status && !STATUSES.includes(status as StockAlertStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid stock alert status",
      });
    }
    const where: Prisma.StockAlertWhereInput = {
      ...accessWhere(req),
      ...(status ? { status: status as StockAlertStatus } : {}),
      ...(typeof req.query.productId === "string"
        ? { productId: req.query.productId }
        : {}),
      ...(typeof req.query.branchId === "string"
        ? { branchId: req.query.branchId }
        : {}),
    };
    const [data, total] = await prisma.$transaction([
      prisma.stockAlert.findMany({
        where,
        include: alertInclude,
        orderBy: { createdAt: "desc" },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      prisma.stockAlert.count({ where }),
    ]);
    return res.json({
      success: true,
      data,
      pagination: paginationMeta(pagination.page, pagination.limit, total),
    });
  } catch (error) {
    return sendInventoryError(res, error);
  }
};

export const getStockAlerts = (req: Request, res: Response) =>
  listAlerts(req, res);

export const getOpenStockAlerts = (req: Request, res: Response) =>
  listAlerts(req, res, "OPEN");

export const getStockAlert = async (req: Request, res: Response) => {
  try {
    const data = await prisma.stockAlert.findFirst({
      where: {
        id: typeof req.params.id === "string" ? req.params.id : "",
        ...accessWhere(req),
      },
      include: alertInclude,
    });
    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Stock alert not found",
      });
    }
    return res.json({ success: true, data });
  } catch (error) {
    return sendInventoryError(res, error);
  }
};

export const resolveStockAlert = async (req: Request, res: Response) => {
  try {
    const id = typeof req.params.id === "string" ? req.params.id : "";
    const existing = await prisma.stockAlert.findFirst({
      where: { id, ...accessWhere(req) },
      select: { id: true, status: true },
    });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Stock alert not found",
      });
    }
    const data =
      existing.status === "RESOLVED"
        ? await prisma.stockAlert.findUniqueOrThrow({
            where: { id },
            include: alertInclude,
          })
        : await prisma.stockAlert.update({
            where: { id },
            data: { status: "RESOLVED", resolvedAt: new Date() },
            include: alertInclude,
          });
    return res.json({
      success: true,
      message:
        existing.status === "RESOLVED"
          ? "Stock alert was already resolved"
          : "Stock alert resolved successfully",
      data,
    });
  } catch (error) {
    return sendInventoryError(res, error);
  }
};
