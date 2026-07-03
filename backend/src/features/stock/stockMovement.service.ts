import { Prisma, type ProductStockMovementType } from "../../generated/prisma/client.js";
import { transactionError } from "../products/inventory-access.js";

type TransactionClient = Prisma.TransactionClient;

type CreateStockMovementInput = {
  tx: TransactionClient;
  salonId: string;
  branchId?: string;
  productId: string;
  type: ProductStockMovementType;
  quantity: Prisma.Decimal | number | string;
  referenceType?: string;
  referenceId?: string;
  reason?: string;
  note?: string;
  createdById?: string;
};

const STOCK_IN_TYPES = new Set<ProductStockMovementType>([
  "STOCK_IN",
  "RETURNED",
]);

const STOCK_OUT_TYPES = new Set<ProductStockMovementType>([
  "STOCK_OUT",
  "RETAIL_SALE",
  "USED_IN_SERVICE",
  "DAMAGED",
]);

const decimalQuantity = (value: Prisma.Decimal | number | string) => {
  try {
    const quantity = new Prisma.Decimal(value);
    if (!quantity.isFinite()) throw new Error("Invalid quantity");
    return quantity;
  } catch {
    throw transactionError("Quantity must be a valid number");
  }
};

export const createStockMovement = async (
  input: CreateStockMovementInput
) => {
  const quantity = decimalQuantity(input.quantity);

  if (
    quantity.isZero() ||
    (input.type !== "ADJUSTMENT" && quantity.isNegative())
  ) {
    throw transactionError(
      "Quantity must be positive; adjustments may be positive or negative"
    );
  }

  await input.tx.$queryRaw<Array<{ id: string }>>`
    SELECT "id"
    FROM "Product"
    WHERE "id" = ${input.productId}
      AND "salonId" = ${input.salonId}
    FOR UPDATE
  `;

  const product = await input.tx.product.findFirst({
    where: {
      id: input.productId,
      salonId: input.salonId,
    },
  });

  if (!product) {
    throw transactionError("Product not found", 404);
  }

  if (input.branchId) {
    const branch = await input.tx.branch.findFirst({
      where: {
        id: input.branchId,
        salonId: input.salonId,
      },
      select: { id: true },
    });

    if (!branch) {
      throw transactionError("Invalid branch for this salon");
    }

    if (product.branchId && product.branchId !== input.branchId) {
      throw transactionError("Product does not belong to the selected branch");
    }
  }

  if (input.referenceType && input.referenceId) {
    const existingMovement = await input.tx.productStockMovement.findFirst({
      where: {
        salonId: input.salonId,
        productId: input.productId,
        type: input.type,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
      },
    });

    if (existingMovement) {
      return {
        product,
        movement: existingMovement,
        duplicate: true,
      };
    }
  }

  const isAdjustment = input.type === "ADJUSTMENT";
  const isStockIn = STOCK_IN_TYPES.has(input.type) ||
    (isAdjustment && quantity.isPositive());
  const isStockOut = STOCK_OUT_TYPES.has(input.type) ||
    (isAdjustment && quantity.isNegative());

  if (!isStockIn && !isStockOut) {
    throw transactionError("Unsupported stock movement type");
  }

  const stockBefore = product.currentStock;
  const absoluteQuantity = quantity.abs();

  if (isStockOut) {
    const changed = await input.tx.product.updateMany({
      where: {
        id: input.productId,
        salonId: input.salonId,
        currentStock: { gte: absoluteQuantity },
      },
      data: {
        currentStock: { decrement: absoluteQuantity },
      },
    });

    if (changed.count !== 1) {
      throw transactionError("Insufficient stock for product");
    }
  } else {
    await input.tx.product.update({
      where: { id: input.productId },
      data: {
        currentStock: { increment: absoluteQuantity },
      },
    });
  }

  const updatedProduct = await input.tx.product.findUniqueOrThrow({
    where: { id: input.productId },
  });

  const movement = await input.tx.productStockMovement.create({
    data: {
      salonId: input.salonId,
      branchId: input.branchId ?? product.branchId,
      productId: input.productId,
      type: input.type,
      quantity,
      stockBefore,
      stockAfter: updatedProduct.currentStock,
      ...(input.reason ? { reason: input.reason } : {}),
      ...(input.note ? { note: input.note } : {}),
      ...(input.referenceType ? { referenceType: input.referenceType } : {}),
      ...(input.referenceId ? { referenceId: input.referenceId } : {}),
      ...(input.createdById ? { createdById: input.createdById } : {}),
    },
  });

  return {
    product: updatedProduct,
    movement,
    duplicate: false,
  };
};
