import { prisma } from "../../config/prisma.js";

export const loyaltyRuleInclude = {
  salon: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;

export const LoyaltyRuleModel = {
  list: (salonId?: string) =>
    prisma.loyaltyRule.findMany({
      ...(salonId ? { where: { salonId } } : {}),
      include: loyaltyRuleInclude,
      orderBy: {
        createdAt: "desc",
      },
    }),

  find: (id: string, salonId?: string) =>
    prisma.loyaltyRule.findFirst({
      where: {
        id,
        ...(salonId ? { salonId } : {}),
      },
      include: loyaltyRuleInclude,
    }),

  findActive: (salonId: string) =>
    prisma.loyaltyRule.findFirst({
      where: {
        salonId,
        status: true,
      },
      include: loyaltyRuleInclude,
      orderBy: {
        updatedAt: "desc",
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
};
