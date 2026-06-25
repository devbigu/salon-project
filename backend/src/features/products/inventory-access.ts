import { type Request } from "express";
import { prisma } from "../../config/prisma.js";

export const INVENTORY_VIEW_ROLES = [
  "SUPER_ADMIN",
  "SALON_ADMIN",
  "RECEPTIONIST",
  "STAFF",
] as const;

export const getSalonId = (req: Request, requestedSalonId?: unknown) =>
  req.user?.role === "SUPER_ADMIN"
    ? typeof requestedSalonId === "string"
      ? requestedSalonId
      : undefined
    : req.user?.salonId;

export const branchScope = (req: Request) =>
  req.user?.role === "RECEPTIONIST" && req.user.branchId
    ? { OR: [{ branchId: req.user.branchId }, { branchId: null }] }
    : {};

export const validateBranch = async (
  salonId: string,
  branchId?: string | null
) => {
  if (!branchId) return true;
  return Boolean(
    await prisma.branch.findFirst({
      where: { id: branchId, salonId },
      select: { id: true },
    })
  );
};

export const cleanText = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

export const numberValue = (value: unknown) => Number(value);

export const productInclude = {
  brand: { select: { id: true, name: true } },
  branch: { select: { id: true, name: true } },
  salon: { select: { id: true, name: true } },
} as const;

export const transactionError = (message: string, status = 400) =>
  Object.assign(new Error(message), { status });

export const sendInventoryError = (
  res: import("express").Response,
  error: unknown
) => {
  const status =
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number"
      ? error.status
      : 500;
  const message =
    error instanceof Error && status !== 500
      ? error.message
      : "Internal server error";
  return res.status(status).json({ success: false, message });
};
