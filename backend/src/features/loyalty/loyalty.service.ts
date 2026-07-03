import { prisma } from "../../config/prisma.js";
import type {
  LoyaltyTransactionType,
  Prisma,
} from "../../generated/prisma/client.js";
import { createAuditLog } from "../audit-logs/audit-log.service.js";

const serviceError = (message: string, status: number) =>
  Object.assign(new Error(message), {
    status,
  });

const isRetryableTransactionError = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === "P2034";

export const findLoyaltyCustomer = (
  customerId: string,
  salonId?: string,
  branchId?: string
) => {
  return prisma.customer.findFirst({
    where: {
      id: customerId,
      ...(salonId ? { salonId } : {}),
      ...(branchId ? { branchId } : {}),
    },
    select: {
      id: true,
      name: true,
      salonId: true,
      branchId: true,
      loyaltyPoints: true,
    },
  });
};

export const getLoyaltyTransactions = (
  customerId: string,
  salonId: string,
  limit?: number
) => {
  return prisma.loyaltyTransaction.findMany({
    where: {
      customerId,
      salonId,
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
    orderBy: [
      {
        createdAt: "desc",
      },
      {
        id: "desc",
      },
    ],
    ...(limit ? { take: limit } : {}),
  });
};

const loyaltyTransactionInclude = {
  customer: {
    select: {
      id: true,
      customerCode: true,
      name: true,
      phone: true,
      salonId: true,
      branchId: true,
    },
  },
  createdBy: {
    select: {
      id: true,
      name: true,
      role: true,
    },
  },
} as const;

export const listLoyaltyTransactions = async (input: {
  page: number;
  limit: number;
  skip: number;
  salonId?: string;
  branchId?: string;
  customerId?: string;
  type?: LoyaltyTransactionType;
  startDate?: Date;
  endDate?: Date;
  referenceType?: string;
  referenceId?: string;
  search?: string;
}) => {
  const where: Prisma.LoyaltyTransactionWhereInput = {
    ...(input.salonId ? { salonId: input.salonId } : {}),
    ...(input.branchId
      ? { customer: { branchId: input.branchId } }
      : {}),
    ...(input.customerId ? { customerId: input.customerId } : {}),
    ...(input.type ? { type: input.type } : {}),
    ...(input.referenceType
      ? { referenceType: input.referenceType }
      : {}),
    ...(input.referenceId ? { referenceId: input.referenceId } : {}),
    ...(input.startDate || input.endDate
      ? {
          createdAt: {
            ...(input.startDate ? { gte: input.startDate } : {}),
            ...(input.endDate ? { lte: input.endDate } : {}),
          },
        }
      : {}),
    ...(input.search
      ? {
          OR: [
            {
              customer: {
                name: { contains: input.search, mode: "insensitive" },
              },
            },
            {
              customer: {
                phone: { contains: input.search, mode: "insensitive" },
              },
            },
            {
              customer: {
                customerCode: {
                  contains: input.search,
                  mode: "insensitive",
                },
              },
            },
            {
              note: { contains: input.search, mode: "insensitive" },
            },
            {
              referenceId: {
                contains: input.search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
  };

  const [data, total] = await prisma.$transaction([
    prisma.loyaltyTransaction.findMany({
      where,
      include: loyaltyTransactionInclude,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: input.skip,
      take: input.limit,
    }),
    prisma.loyaltyTransaction.count({ where }),
  ]);

  return {
    data,
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      totalPages: Math.ceil(total / input.limit),
    },
  };
};

export const adjustLoyaltyPoints = async (input: {
  customerId: string;
  salonId: string;
  points: number;
  createdById: string;
  note?: string;
  ipAddress?: string;
  userAgent?: string;
}) => {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const customer = await tx.customer.findFirst({
            where: {
              id: input.customerId,
              salonId: input.salonId,
            },
            select: {
              id: true,
              name: true,
              salonId: true,
              loyaltyPoints: true,
            },
          });

          if (!customer) {
            throw serviceError("Customer not found", 404);
          }

          const balanceBefore = customer.loyaltyPoints;
          const balanceAfter = balanceBefore + input.points;

          if (balanceAfter < 0) {
            throw serviceError(
              "Loyalty point balance cannot go below 0",
              400
            );
          }

          const updatedCustomer = await tx.customer.update({
            where: {
              id: customer.id,
            },
            data: {
              loyaltyPoints: balanceAfter,
            },
            select: {
              id: true,
              name: true,
              salonId: true,
              loyaltyPoints: true,
            },
          });

          const transaction = await tx.loyaltyTransaction.create({
            data: {
              salonId: input.salonId,
              customerId: customer.id,
              type: "ADJUSTED",
              points: input.points,
              balanceBefore,
              balanceAfter,
              referenceType: "MANUAL_ADJUSTMENT",
              createdById: input.createdById,
              ...(input.note ? { note: input.note } : {}),
            },
            include: {
              createdBy: {
                select: {
                  id: true,
                  name: true,
                  role: true,
                },
              },
            },
          });
          await createAuditLog({ tx, salonId: input.salonId, userId: input.createdById,
            module: "LOYALTY", action: "UPDATE", entityId: transaction.id, entityName: customer.name,
            description: `Admin adjusted ${input.points} loyalty points for customer ${customer.name}`,
            oldData: { customerId: customer.id, balanceBefore },
            newData: { customerId: customer.id, points: input.points, balanceAfter, referenceType: "MANUAL_ADJUSTMENT" },
            ipAddress: input.ipAddress, userAgent: input.userAgent });

          return {
            customer: updatedCustomer,
            transaction,
          };
        },
        {
          isolationLevel: "Serializable",
        }
      );
    } catch (error) {
      if (isRetryableTransactionError(error) && attempt < 3) {
        continue;
      }

      throw error;
    }
  }

  throw serviceError("Unable to adjust loyalty points", 409);
};
