import { prisma } from "../../config/prisma.js";

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
  salonId: string
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
  });
};

export const adjustLoyaltyPoints = async (input: {
  customerId: string;
  salonId: string;
  points: number;
  createdById: string;
  note?: string;
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
