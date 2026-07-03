import { prisma } from "../../config/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";

export const couponInclude = {
  salon: { select: { id: true, name: true } },
  branch: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true, role: true } },
  _count: { select: { invoices: true } },
} as const;

export const CouponModel = {
  list: async (input: {
    where: Prisma.CouponWhereInput;
    skip: number;
    take: number;
    orderBy: Prisma.CouponOrderByWithRelationInput;
  }) => {
    const [data, total] = await prisma.$transaction([
      prisma.coupon.findMany({
        where: input.where,
        include: couponInclude,
        orderBy: input.orderBy,
        skip: input.skip,
        take: input.take,
      }),
      prisma.coupon.count({ where: input.where }),
    ]);
    return { data, total };
  },

  find: (where: Prisma.CouponWhereInput) =>
    prisma.coupon.findFirst({ where, include: couponInclude }),

  duplicate: (salonId: string, couponCode: string, excludeId?: string) =>
    prisma.coupon.findFirst({
      where: {
        salonId,
        couponCode,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    }),

  create: (data: Prisma.CouponUncheckedCreateInput, tx: Prisma.TransactionClient) =>
    tx.coupon.create({ data, include: couponInclude }),

  update: (
    id: string,
    data: Prisma.CouponUncheckedUpdateInput,
    tx: Prisma.TransactionClient
  ) => tx.coupon.update({ where: { id }, data, include: couponInclude }),

  remove: (id: string, tx: Prisma.TransactionClient) =>
    tx.coupon.delete({ where: { id } }),
};
