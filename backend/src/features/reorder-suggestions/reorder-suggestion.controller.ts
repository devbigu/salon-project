import { type Request, type Response } from "express";
import { prisma } from "../../config/prisma.js";
import {
  Prisma,
  type ReorderSuggestionStatus,
} from "../../generated/prisma/client.js";
import { paginationMeta, parsePagination } from "../../utils/pagination.js";
import { createReceivedProductPurchase } from "../product-purchases/product-purchase.service.js";
import {
  branchScope,
  sendInventoryError,
  transactionError,
} from "../products/inventory-access.js";
import {
  createAuditLog,
  requestAuditContext,
} from "../audit-logs/audit-log.service.js";

const STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CONVERTED_TO_PURCHASE",
] as const;

const accessWhere = (
  req: Request
): Prisma.ReorderSuggestionWhereInput => ({
  ...(req.user?.role === "SUPER_ADMIN"
    ? typeof req.query.salonId === "string"
      ? { salonId: req.query.salonId }
      : {}
    : { salonId: req.user?.salonId ?? "__missing__" }),
  ...branchScope(req),
});

const suggestionInclude = {
  product: {
    select: {
      id: true,
      name: true,
      sku: true,
      unit: true,
      currentStock: true,
      lowStockAlert: true,
    },
  },
  vendor: { select: { id: true, name: true } },
  branch: { select: { id: true, name: true } },
  convertedPurchase: {
    select: { id: true, purchaseCode: true },
  },
} as const;

const listSuggestions = async (
  req: Request,
  res: Response,
  forcedStatus?: ReorderSuggestionStatus
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
    if (status && !STATUSES.includes(status as ReorderSuggestionStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid reorder suggestion status",
      });
    }
    const where: Prisma.ReorderSuggestionWhereInput = {
      ...accessWhere(req),
      ...(status ? { status: status as ReorderSuggestionStatus } : {}),
      ...(typeof req.query.productId === "string"
        ? { productId: req.query.productId }
        : {}),
      ...(typeof req.query.vendorId === "string"
        ? { vendorId: req.query.vendorId }
        : {}),
      ...(typeof req.query.branchId === "string"
        ? { branchId: req.query.branchId }
        : {}),
    };
    const [data, total] = await prisma.$transaction([
      prisma.reorderSuggestion.findMany({
        where,
        include: suggestionInclude,
        orderBy: { createdAt: "desc" },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      prisma.reorderSuggestion.count({ where }),
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

export const getReorderSuggestions = (req: Request, res: Response) =>
  listSuggestions(req, res);

export const getPendingReorderSuggestions = (req: Request, res: Response) =>
  listSuggestions(req, res, "PENDING");

export const getReorderSuggestion = async (
  req: Request,
  res: Response
) => {
  try {
    const data = await prisma.reorderSuggestion.findFirst({
      where: {
        id: typeof req.params.id === "string" ? req.params.id : "",
        ...accessWhere(req),
      },
      include: suggestionInclude,
    });
    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Reorder suggestion not found",
      });
    }
    return res.json({ success: true, data });
  } catch (error) {
    return sendInventoryError(res, error);
  }
};

const transitionSuggestion = async (
  req: Request,
  res: Response,
  action: "approve" | "reject"
) => {
  try {
    const id = typeof req.params.id === "string" ? req.params.id : "";
    const data = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "ReorderSuggestion"
        WHERE "id" = ${id}
        FOR UPDATE
      `;
      const existing = await tx.reorderSuggestion.findFirst({
        where: { id, ...accessWhere(req) },
      });
      if (!existing) {
        throw transactionError("Reorder suggestion not found", 404);
      }
      if (
        action === "approve" &&
        existing.status !== "PENDING"
      ) {
        throw transactionError(
          "Only pending reorder suggestions can be approved",
          409
        );
      }
      if (
        action === "reject" &&
        !["PENDING", "APPROVED"].includes(existing.status)
      ) {
        throw transactionError(
          "Only pending or approved reorder suggestions can be rejected",
          409
        );
      }
      const updated = await tx.reorderSuggestion.update({
        where: { id },
        data:
          action === "approve"
            ? {
                status: "APPROVED",
                approvedAt: new Date(),
                rejectedAt: null,
              }
            : {
                status: "REJECTED",
                rejectedAt: new Date(),
              },
        include: suggestionInclude,
      });
      await createAuditLog({
        tx,
        salonId: existing.salonId,
        branchId: existing.branchId,
        userId: req.user?.userId,
        module: "REORDER",
        action: action === "approve" ? "APPROVE" : "REJECT",
        entityId: existing.id,
        entityName: updated.product.name,
        description: `Reorder suggestion for ${updated.product.name} ${
          action === "approve" ? "approved" : "rejected"
        }`,
        oldData: { status: existing.status },
        newData: { status: updated.status },
        ...requestAuditContext(req),
      });
      return updated;
    });
    return res.json({
      success: true,
      message:
        action === "approve"
          ? "Reorder suggestion approved successfully"
          : "Reorder suggestion rejected successfully",
      data,
    });
  } catch (error) {
    return sendInventoryError(res, error);
  }
};

export const approveReorderSuggestion = (req: Request, res: Response) =>
  transitionSuggestion(req, res, "approve");

export const rejectReorderSuggestion = (req: Request, res: Response) =>
  transitionSuggestion(req, res, "reject");

export const convertReorderSuggestionToPurchase = async (
  req: Request,
  res: Response
) => {
  try {
    const id = typeof req.params.id === "string" ? req.params.id : "";
    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "ReorderSuggestion"
        WHERE "id" = ${id}
        FOR UPDATE
      `;
      const suggestion = await tx.reorderSuggestion.findFirst({
        where: { id, ...accessWhere(req) },
        include: {
          product: true,
          vendor: { select: { name: true, phone: true } },
          convertedPurchase: {
            select: { id: true, purchaseCode: true },
          },
        },
      });
      if (!suggestion) {
        throw transactionError("Reorder suggestion not found", 404);
      }
      if (
        suggestion.status === "CONVERTED_TO_PURCHASE" &&
        suggestion.convertedPurchaseId
      ) {
        return {
          purchaseId: suggestion.convertedPurchaseId,
          purchaseCode: suggestion.convertedPurchase?.purchaseCode ?? null,
          alreadyConverted: true,
        };
      }
      if (suggestion.status === "REJECTED") {
        throw transactionError(
          "Rejected reorder suggestions cannot be converted",
          409
        );
      }
      if (!["PENDING", "APPROVED"].includes(suggestion.status)) {
        throw transactionError(
          "Reorder suggestion cannot be converted in its current status",
          409
        );
      }

      const purchase = await createReceivedProductPurchase({
        tx,
        salonId: suggestion.salonId,
        ...(suggestion.branchId ? { branchId: suggestion.branchId } : {}),
        ...(suggestion.vendorId ? { vendorId: suggestion.vendorId } : {}),
        ...(suggestion.vendor?.name
          ? { supplierName: suggestion.vendor.name }
          : {}),
        ...(suggestion.vendor?.phone
          ? { supplierPhone: suggestion.vendor.phone }
          : {}),
        ...(req.user?.userId ? { createdById: req.user.userId } : {}),
        items: [
          {
            productId: suggestion.productId,
            quantity: suggestion.suggestedQuantity,
            unitCost: suggestion.product.costPrice,
          },
        ],
      });
      await tx.reorderSuggestion.update({
        where: { id },
        data: {
          status: "CONVERTED_TO_PURCHASE",
          convertedPurchaseId: purchase.id,
        },
      });
      await createAuditLog({
        tx,
        salonId: suggestion.salonId,
        branchId: suggestion.branchId,
        userId: req.user?.userId,
        module: "REORDER",
        action: "CONVERT",
        entityId: suggestion.id,
        entityCode: purchase.purchaseCode,
        entityName: suggestion.product.name,
        description: `Reorder suggestion for ${suggestion.product.name} converted to purchase ${purchase.purchaseCode}`,
        oldData: { status: suggestion.status },
        newData: {
          status: "CONVERTED_TO_PURCHASE",
          convertedPurchaseId: purchase.id,
          suggestedQuantity: suggestion.suggestedQuantity,
        },
        ...requestAuditContext(req),
      });
      return {
        purchaseId: purchase.id,
        purchaseCode: purchase.purchaseCode,
        alreadyConverted: false,
      };
    });

    return res.status(result.alreadyConverted ? 200 : 201).json({
      success: true,
      message: result.alreadyConverted
        ? "Reorder suggestion was already converted"
        : "Reorder suggestion converted to received purchase",
      data: result,
    });
  } catch (error) {
    return sendInventoryError(res, error);
  }
};
