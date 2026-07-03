import { prisma } from "../../config/prisma.js";
import { awardInvoiceLoyaltyInTransaction } from "../Invoices/invoice-retention.service.js";

type PaymentMethod = "CASH" | "CARD" | "UPI" | "OTHER";
type PaymentStatus = "UNPAID" | "PARTIALLY_PAID" | "PAID";

export class PaymentConflictError extends Error {}

export const PaymentModel = {
  createAndUpdateInvoice: async (data: {
    salonId: string;
    branchId?: string;
    customerId: string;
    invoiceId: string;
    amount: number;
    method: PaymentMethod;
    referenceNo?: string;
    note?: string;
    paidAt?: Date;
    createdById?: string;
  }) => {
    return prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Invoice" WHERE "id" = ${data.invoiceId} FOR UPDATE`;

      const lockedInvoice = await tx.invoice.findUnique({
        where: { id: data.invoiceId },
      });
      if (!lockedInvoice || lockedInvoice.salonId !== data.salonId) {
        throw new PaymentConflictError("Invoice not found");
      }
      if (lockedInvoice.status === "CANCELLED") {
        throw new PaymentConflictError("Cannot add payment to cancelled invoice");
      }
      if (lockedInvoice.paymentStatus === "PAID") {
        throw new PaymentConflictError("Invoice is already fully paid");
      }

      const currentPaidAmount = Number(lockedInvoice.paidAmount);
      const currentBalanceAmount = Number(lockedInvoice.balanceAmount);
      const totalAmount = Number(lockedInvoice.totalAmount);
      if (data.amount > currentBalanceAmount) {
        throw new PaymentConflictError(
          "Payment amount cannot be greater than invoice balance"
        );
      }
      const newPaidAmount = Number((currentPaidAmount + data.amount).toFixed(2));
      const newBalanceAmount = Number((totalAmount - newPaidAmount).toFixed(2));
      const newPaymentStatus: PaymentStatus =
        newBalanceAmount <= 0 ? "PAID" : "PARTIALLY_PAID";

      const payment = await tx.payment.create({
        data: {
          salonId: data.salonId,
          ...(data.branchId ? { branchId: data.branchId } : {}),
          customerId: data.customerId,
          invoiceId: data.invoiceId,
          amount: data.amount,
          method: data.method,
          ...(data.referenceNo ? { referenceNo: data.referenceNo } : {}),
          ...(data.note ? { note: data.note } : {}),
          ...(data.paidAt ? { paidAt: data.paidAt } : {}),
        },
        include: {
          salon: {
            select: {
              id: true,
              name: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
              customerCode: true,
            },
          },
          invoice: {
            select: {
              id: true,
              invoiceCode: true,
              totalAmount: true,
              paidAmount: true,
              balanceAmount: true,
              paymentStatus: true,
            },
          },
        },
      });

      const invoice = await tx.invoice.update({
        where: {
          id: data.invoiceId,
        },
        data: {
          paidAmount: newPaidAmount,
          balanceAmount: newBalanceAmount,
          paymentStatus: newPaymentStatus,
        },
        include: {
          items: true,
          payments: true,
        },
      });

      const customer = await tx.customer.update({
        where: { id: data.customerId },
        data: { outstandingAmount: { decrement: data.amount } },
      });

      await tx.customerTransaction.create({
        data: {
          customerId: data.customerId,
          salonId: data.salonId,
          invoiceId: data.invoiceId,
          paymentId: payment.id,
          billNo: lockedInvoice.invoiceCode,
          narration: `Payment received via ${data.method}`,
          type: "PAYMENT",
          debit: 0,
          credit: data.amount,
          balanceAfter: customer.outstandingAmount,
          status: "COMPLETE",
        },
      });

      const loyalty =
        newPaymentStatus === "PAID"
          ? await awardInvoiceLoyaltyInTransaction(tx, {
              invoiceId: lockedInvoice.id,
              salonId: lockedInvoice.salonId,
              customerId: lockedInvoice.customerId,
              finalPaidAmount: newPaidAmount,
              ...(data.createdById
                ? { createdById: data.createdById }
                : {}),
            })
          : null;

      return {
        payment,
        invoice,
        loyalty,
      };
    });
  },

  findAll: async () => {
    return prisma.payment.findMany({
      include: {
        salon: {
          select: {
            id: true,
            name: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            customerCode: true,
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceCode: true,
            totalAmount: true,
            paidAmount: true,
            balanceAmount: true,
            paymentStatus: true,
          },
        },
      },
      orderBy: {
        paidAt: "desc",
      },
    });
  },

  findBySalon: async (
    salonId: string,
    filters?: {
      branchId?: string;
      customerId?: string;
      invoiceId?: string;
      method?: PaymentMethod;
    }
  ) => {
    return prisma.payment.findMany({
      where: {
        salonId,
        ...(filters?.branchId ? { branchId: filters.branchId } : {}),
        ...(filters?.customerId ? { customerId: filters.customerId } : {}),
        ...(filters?.invoiceId ? { invoiceId: filters.invoiceId } : {}),
        ...(filters?.method ? { method: filters.method } : {}),
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            customerCode: true,
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceCode: true,
            totalAmount: true,
            paidAmount: true,
            balanceAmount: true,
            paymentStatus: true,
          },
        },
      },
      orderBy: {
        paidAt: "desc",
      },
    });
  },

  findById: async (id: string) => {
    return prisma.payment.findUnique({
      where: {
        id,
      },
      include: {
        salon: {
          select: {
            id: true,
            name: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            customerCode: true,
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceCode: true,
            totalAmount: true,
            paidAmount: true,
            balanceAmount: true,
            paymentStatus: true,
          },
        },
      },
    });
  },

  findByIdAndSalon: async (id: string, salonId: string) => {
    return prisma.payment.findFirst({
      where: {
        id,
        salonId,
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            customerCode: true,
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceCode: true,
            totalAmount: true,
            paidAmount: true,
            balanceAmount: true,
            paymentStatus: true,
          },
        },
      },
    });
  },
};
