import { prisma } from "../../config/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";

const include = {
  salon: {
    select: {
      id: true,
      name: true,
    },
  },
  _count: {
    select: {
      customers: true,
    },
  },
} as const;

export const MembershipModel = {
  create: (data: {
    salonId: string;
    name: string;
    description?: string;
    discountPercentage?: number;
  }, tx?: Prisma.TransactionClient) => (tx ?? prisma).membership.create({ data, include }),

  list: (salonId?: string) =>
    prisma.membership.findMany({
      ...(salonId ? { where: { salonId } } : {}),
      include,
      orderBy: {
        name: "asc",
      },
    }),

  find: (id: string, salonId?: string) =>
    prisma.membership.findFirst({
      where: {
        id,
        ...(salonId ? { salonId } : {}),
      },
      include,
    }),

  duplicate: (salonId: string, name: string, excludeId?: string) =>
    prisma.membership.findFirst({
      where: {
        salonId,
        name: {
          equals: name,
          mode: "insensitive",
        },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: {
        id: true,
      },
    }),

  salonExists: (salonId: string) =>
    prisma.salon.findUnique({
      where: {
        id: salonId,
      },
      select: {
        id: true,
      },
    }),

  update: (
    id: string,
    data: {
      name?: string;
      description?: string | null;
      discountPercentage?: number;
      status?: boolean;
    },
    tx?: Prisma.TransactionClient
  ) =>
    (tx ?? prisma).membership.update({
      where: {
        id,
      },
      data,
      include,
    }),

  remove: (id: string, tx?: Prisma.TransactionClient) =>
    (tx ?? prisma).membership.delete({
      where: {
        id,
      },
    }),
};
