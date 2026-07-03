import { prisma } from "../../config/prisma.js";
import { loyaltyRuleInclude } from "./loyalty-rule.model.js";

export type LoyaltyRuleValues = {
  earnPointsPerAmount: number;
  earnAmountStep: number;
  redeemValuePerPoint: number;
  minRedeemPoints: number;
  maxRedeemPoints: number | null;
};

export const createLoyaltyRule = async (
  salonId: string,
  values: LoyaltyRuleValues,
  status: boolean
) => {
  return prisma.$transaction(
    async (tx) => {
      if (status) {
        await tx.loyaltyRule.updateMany({
          where: {
            salonId,
            status: true,
          },
          data: {
            status: false,
          },
        });
      }

      return tx.loyaltyRule.create({
        data: {
          salonId,
          ...values,
          status,
        },
        include: loyaltyRuleInclude,
      });
    },
    {
      isolationLevel: "Serializable",
    }
  );
};

export const updateLoyaltyRule = (
  id: string,
  values: LoyaltyRuleValues
) => {
  return prisma.loyaltyRule.update({
    where: {
      id,
    },
    data: values,
    include: loyaltyRuleInclude,
  });
};

export const updateLoyaltyRuleStatus = async (
  id: string,
  salonId: string,
  status: boolean
) => {
  return prisma.$transaction(
    async (tx) => {
      if (status) {
        await tx.loyaltyRule.updateMany({
          where: {
            salonId,
            status: true,
            id: {
              not: id,
            },
          },
          data: {
            status: false,
          },
        });
      }

      return tx.loyaltyRule.update({
        where: {
          id,
        },
        data: {
          status,
        },
        include: loyaltyRuleInclude,
      });
    },
    {
      isolationLevel: "Serializable",
    }
  );
};
