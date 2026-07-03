import {
  Prisma,
  type Product,
} from "../../generated/prisma/client.js";
import { transactionError } from "../products/inventory-access.js";

type TransactionClient = Prisma.TransactionClient;

type LifecycleProduct = Pick<
  Product,
  | "id"
  | "salonId"
  | "branchId"
  | "vendorId"
  | "currentStock"
  | "lowStockAlert"
>;

export const ensureLowStockAlert = async (
  tx: TransactionClient,
  product: LifecycleProduct,
  branchId?: string
) => {
  const existing = await tx.stockAlert.findFirst({
    where: {
      salonId: product.salonId,
      productId: product.id,
      status: "OPEN",
    },
    select: { id: true },
  });

  if (existing) return existing;

  return tx.stockAlert.create({
    data: {
      salonId: product.salonId,
      branchId: branchId ?? product.branchId,
      productId: product.id,
      currentStock: product.currentStock,
      threshold: product.lowStockAlert,
      status: "OPEN",
    },
    select: { id: true },
  });
};

export const resolveLowStockAlertIfRecovered = async (
  tx: TransactionClient,
  product: LifecycleProduct
) =>
  tx.stockAlert.updateMany({
    where: {
      salonId: product.salonId,
      productId: product.id,
      status: "OPEN",
    },
    data: {
      status: "RESOLVED",
      resolvedAt: new Date(),
    },
  });

export const ensureReorderSuggestion = async (
  tx: TransactionClient,
  product: LifecycleProduct,
  branchId?: string
) => {
  const existing = await tx.reorderSuggestion.findFirst({
    where: {
      salonId: product.salonId,
      productId: product.id,
      status: { in: ["PENDING", "APPROVED"] },
    },
    select: { id: true },
  });

  if (existing) return existing;

  const calculated = product.lowStockAlert
    .mul(2)
    .minus(product.currentStock);
  const suggestedQuantity = Prisma.Decimal.max(
    calculated,
    new Prisma.Decimal(1)
  );

  return tx.reorderSuggestion.create({
    data: {
      salonId: product.salonId,
      branchId: branchId ?? product.branchId,
      productId: product.id,
      vendorId: product.vendorId,
      suggestedQuantity,
      status: "PENDING",
    },
    select: { id: true },
  });
};

export const syncStockLifecycleAfterMovement = async (
  tx: TransactionClient,
  productId: string,
  salonId: string,
  branchId?: string
) => {
  const product = await tx.product.findFirst({
    where: { id: productId, salonId },
  });

  if (!product) {
    throw transactionError("Product not found", 404);
  }

  if (product.lowStockAlert.lessThanOrEqualTo(0)) {
    return { product, lowStock: false, skipped: true };
  }

  const lowStock = product.currentStock.lessThanOrEqualTo(
    product.lowStockAlert
  );

  if (lowStock) {
    await ensureLowStockAlert(tx, product, branchId);
    await ensureReorderSuggestion(tx, product, branchId);
  } else {
    await resolveLowStockAlertIfRecovered(tx, product);
  }

  return { product, lowStock, skipped: false };
};
