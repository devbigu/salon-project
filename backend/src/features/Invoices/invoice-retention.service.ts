import { type Prisma } from "../../generated/prisma/client.js";
import { prisma as prismaClient } from "../../config/prisma.js";
import { createAuditLog } from "../audit-logs/audit-log.service.js";

export class InvoiceRetentionError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
  }
}

type TransactionClient = Prisma.TransactionClient;

const money = (value: number) => Number(value.toFixed(2));

const awardPaidInvoiceLoyalty = async (
  tx: TransactionClient,
  input: {
    invoiceId: string;
    salonId: string;
    customerId: string;
    finalPaidAmount: number;
    createdById?: string;
  }
) => {
  const existing = await tx.loyaltyTransaction.findFirst({
    where: {
      salonId: input.salonId,
      customerId: input.customerId,
      type: "EARNED",
      referenceType: "INVOICE",
      referenceId: input.invoiceId,
    },
  });

  if (existing) {
    return {
      pointsEarned: 0,
      transaction: existing,
      alreadyAwarded: true,
    };
  }

  const rule = await tx.loyaltyRule.findFirst({
    where: {
      salonId: input.salonId,
      status: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  if (!rule) {
    return null;
  }

  const earnAmountStep = Number(rule.earnAmountStep);
  const earnPointsPerAmount = Number(rule.earnPointsPerAmount);

  if (earnAmountStep <= 0 || earnPointsPerAmount <= 0) {
    return null;
  }

  const completedSteps = Math.floor(input.finalPaidAmount / earnAmountStep);
  const pointsEarned = Math.floor(completedSteps * earnPointsPerAmount);

  if (pointsEarned <= 0) {
    return null;
  }

  const customer = await tx.customer.findFirst({
    where: {
      id: input.customerId,
      salonId: input.salonId,
    },
    select: {
      loyaltyPoints: true,
    },
  });

  if (!customer) {
    throw new InvoiceRetentionError("Customer not found", 404);
  }

  const balanceBefore = customer.loyaltyPoints;
  const balanceAfter = balanceBefore + pointsEarned;

  await tx.customer.update({
    where: {
      id: input.customerId,
    },
    data: {
      loyaltyPoints: balanceAfter,
    },
  });

  const transaction = await tx.loyaltyTransaction.create({
    data: {
      salonId: input.salonId,
      customerId: input.customerId,
      type: "EARNED",
      points: pointsEarned,
      balanceBefore,
      balanceAfter,
      referenceType: "INVOICE",
      referenceId: input.invoiceId,
      ...(input.createdById ? { createdById: input.createdById } : {}),
    },
  });
  await createAuditLog({
    tx, salonId: input.salonId, userId: input.createdById,
    module: "LOYALTY", action: "CREATE", entityId: transaction.id,
    entityCode: input.invoiceId,
    description: `Customer earned ${pointsEarned} loyalty points from invoice ${input.invoiceId}`,
    newData: { customerId: input.customerId, points: pointsEarned, balanceBefore, balanceAfter, referenceType: "INVOICE", referenceId: input.invoiceId },
  });

  return {
    pointsEarned,
    transaction,
    alreadyAwarded: false,
  };
};

export const awardInvoiceLoyaltyInTransaction = awardPaidInvoiceLoyalty;

export const redeemInvoiceLoyalty = async (input: {
  invoiceId: string;
  salonId?: string;
  points: number;
  createdById: string;
  ipAddress?: string;
  userAgent?: string;
}) => {
  return prismaClient.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Invoice" WHERE "id" = ${input.invoiceId} FOR UPDATE`;

    const invoice = await tx.invoice.findFirst({
      where: {
        id: input.invoiceId,
        ...(input.salonId ? { salonId: input.salonId } : {}),
      },
    });

    if (!invoice) {
      throw new InvoiceRetentionError("Invoice not found", 404);
    }

    if (invoice.status === "CANCELLED") {
      throw new InvoiceRetentionError(
        "Cannot redeem loyalty points on a cancelled invoice",
        400
      );
    }

    if (invoice.paymentStatus === "PAID") {
      throw new InvoiceRetentionError(
        "Cannot redeem loyalty points on a fully paid invoice",
        400
      );
    }

    const currentBalanceAmount = Number(invoice.balanceAmount);

    if (currentBalanceAmount <= 0) {
      throw new InvoiceRetentionError(
        "Invoice has no redeemable balance",
        400
      );
    }

    await tx.$queryRaw`SELECT "id" FROM "Customer" WHERE "id" = ${invoice.customerId} FOR UPDATE`;

    const customer = await tx.customer.findFirst({
      where: {
        id: invoice.customerId,
        salonId: invoice.salonId,
      },
      select: {
        id: true,
        salonId: true,
        loyaltyPoints: true,
        outstandingAmount: true,
      },
    });

    if (!customer) {
      throw new InvoiceRetentionError("Customer not found", 404);
    }

    if (customer.loyaltyPoints < input.points) {
      throw new InvoiceRetentionError(
        "Customer does not have enough loyalty points",
        400
      );
    }

    const rule = await tx.loyaltyRule.findFirst({
      where: {
        salonId: invoice.salonId,
        status: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    if (!rule) {
      throw new InvoiceRetentionError(
        "Active loyalty rule is required",
        400
      );
    }

    if (input.points < rule.minRedeemPoints) {
      throw new InvoiceRetentionError(
        `At least ${rule.minRedeemPoints} points must be redeemed`,
        400
      );
    }

    if (
      rule.maxRedeemPoints !== null &&
      input.points > rule.maxRedeemPoints
    ) {
      throw new InvoiceRetentionError(
        `No more than ${rule.maxRedeemPoints} points may be redeemed`,
        400
      );
    }

    const discountValue = money(
      input.points * Number(rule.redeemValuePerPoint)
    );

    if (discountValue <= 0) {
      throw new InvoiceRetentionError(
        "Selected points have no redeemable value",
        400
      );
    }

    if (discountValue > currentBalanceAmount) {
      throw new InvoiceRetentionError(
        "Loyalty discount cannot exceed invoice balance",
        400
      );
    }

    const loyaltyBalanceBefore = customer.loyaltyPoints;
    const loyaltyBalanceAfter = loyaltyBalanceBefore - input.points;
    const paidAmount = Number(invoice.paidAmount);
    const totalAmount = Number(invoice.totalAmount);
    const discountAmount = Number(invoice.discountAmount);
    const newBalanceAmount = Math.max(
      money(currentBalanceAmount - discountValue),
      0
    );
    const newTotalAmount = Math.max(
      money(totalAmount - discountValue),
      paidAmount
    );
    const paymentStatus =
      newBalanceAmount <= 0
        ? "PAID"
        : paidAmount > 0
          ? "PARTIALLY_PAID"
          : "UNPAID";
    const newOutstandingAmount = Math.max(
      money(Number(customer.outstandingAmount) - discountValue),
      0
    );

    await tx.customer.update({
      where: {
        id: customer.id,
      },
      data: {
        loyaltyPoints: loyaltyBalanceAfter,
        outstandingAmount: newOutstandingAmount,
      },
    });

    const loyaltyTransaction = await tx.loyaltyTransaction.create({
      data: {
        salonId: invoice.salonId,
        customerId: customer.id,
        type: "REDEEMED",
        points: -input.points,
        balanceBefore: loyaltyBalanceBefore,
        balanceAfter: loyaltyBalanceAfter,
        referenceType: "INVOICE",
        referenceId: invoice.id,
        createdById: input.createdById,
      },
    });

    const updatedInvoice = await tx.invoice.update({
      where: {
        id: invoice.id,
      },
      data: {
        discountAmount: money(discountAmount + discountValue),
        totalAmount: newTotalAmount,
        balanceAmount: newBalanceAmount,
        paymentStatus,
      },
      include: {
        items: true,
        payments: true,
        customer: {
          select: {
            id: true,
            name: true,
            loyaltyPoints: true,
            membership: {
              select: {
                id: true,
                name: true,
                discountPercentage: true,
                status: true,
              },
            },
          },
        },
      },
    });

    await tx.customerTransaction.create({
      data: {
        customerId: customer.id,
        salonId: invoice.salonId,
        invoiceId: invoice.id,
        billNo: invoice.invoiceCode,
        narration: `Loyalty points redeemed on invoice ${invoice.invoiceCode}`,
        type: "ADJUSTMENT",
        debit: 0,
        credit: discountValue,
        balanceAfter: newOutstandingAmount,
        status: "COMPLETE",
      },
    });

    await createAuditLog({
      tx,
      salonId: invoice.salonId,
      branchId: invoice.branchId,
      userId: input.createdById,
      module: "INVOICE",
      action: "UPDATE",
      entityId: invoice.id,
      entityCode: invoice.invoiceCode,
      entityName: invoice.customerName,
      description: `Loyalty redemption applied to invoice ${invoice.invoiceCode}`,
      oldData: {
        discountAmount: invoice.discountAmount,
        totalAmount: invoice.totalAmount,
        balanceAmount: invoice.balanceAmount,
        paymentStatus: invoice.paymentStatus,
      },
      newData: {
        discountAmount: updatedInvoice.discountAmount,
        totalAmount: updatedInvoice.totalAmount,
        balanceAmount: updatedInvoice.balanceAmount,
        paymentStatus: updatedInvoice.paymentStatus,
      },
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });
    await createAuditLog({
      tx, salonId: invoice.salonId, branchId: invoice.branchId, userId: input.createdById,
      module: "LOYALTY", action: "UPDATE", entityId: loyaltyTransaction.id,
      entityCode: invoice.invoiceCode, entityName: invoice.customerName,
      description: `Customer redeemed ${input.points} loyalty points on invoice ${invoice.invoiceCode}`,
      oldData: { customerId: customer.id, balanceBefore: loyaltyBalanceBefore },
      newData: { customerId: customer.id, points: -input.points, balanceAfter: loyaltyBalanceAfter, referenceType: "INVOICE", referenceId: invoice.id },
      ipAddress: input.ipAddress, userAgent: input.userAgent,
    });

    const loyaltyAward =
      paymentStatus === "PAID"
        ? await awardPaidInvoiceLoyalty(tx, {
            invoiceId: invoice.id,
            salonId: invoice.salonId,
            customerId: customer.id,
            finalPaidAmount: paidAmount,
            createdById: input.createdById,
          })
        : null;

    const updatedCustomer = await tx.customer.findUnique({
      where: {
        id: customer.id,
      },
      select: {
        id: true,
        name: true,
        salonId: true,
        loyaltyPoints: true,
        outstandingAmount: true,
      },
    });

    return {
      invoice: updatedInvoice,
      customer: updatedCustomer,
      loyaltyTransaction,
      discountValue,
      loyaltyAward,
    };
  });
};
