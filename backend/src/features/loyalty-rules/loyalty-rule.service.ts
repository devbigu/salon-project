import { prisma } from "../../config/prisma.js";
import { loyaltyRuleInclude } from "./loyalty-rule.model.js";
import { createAuditLog } from "../audit-logs/audit-log.service.js";

type Actor = { userId?: string | undefined; ipAddress?: string | undefined; userAgent?: string | undefined };
const safeRule = (r: { id: string; earnPointsPerAmount: unknown; earnAmountStep: unknown; redeemValuePerPoint: unknown; minRedeemPoints: number; maxRedeemPoints: number | null; status: boolean }) => ({
  loyaltyRuleId: r.id, earnPointsPerAmount: r.earnPointsPerAmount, earnAmountStep: r.earnAmountStep,
  redeemValuePerPoint: r.redeemValuePerPoint, minRedeemPoints: r.minRedeemPoints,
  maxRedeemPoints: r.maxRedeemPoints, status: r.status,
});

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
  status: boolean,
  actor: Actor = {}
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

      const created = await tx.loyaltyRule.create({
        data: {
          salonId,
          ...values,
          status,
        },
        include: loyaltyRuleInclude,
      });
      await createAuditLog({ tx, salonId, userId: actor.userId, module: "LOYALTY", action: "CREATE",
        entityId: created.id, description: "Admin created loyalty rule", newData: safeRule(created),
        ipAddress: actor.ipAddress, userAgent: actor.userAgent });
      return created;
    },
    {
      isolationLevel: "Serializable",
    }
  );
};

export const updateLoyaltyRule = (
  id: string,
  values: LoyaltyRuleValues,
  actor: Actor = {}
) => {
  return prisma.$transaction(async (tx) => {
    const old = await tx.loyaltyRule.findUniqueOrThrow({ where: { id } });
    const updated = await tx.loyaltyRule.update({ where: { id }, data: values, include: loyaltyRuleInclude });
    await createAuditLog({ tx, salonId: old.salonId, userId: actor.userId, module: "LOYALTY", action: "UPDATE",
      entityId: id, description: "Admin updated loyalty rule", oldData: safeRule(old), newData: safeRule(updated),
      ipAddress: actor.ipAddress, userAgent: actor.userAgent });
    return updated;
  });
};

export const updateLoyaltyRuleStatus = async (
  id: string,
  salonId: string,
  status: boolean,
  actor: Actor = {}
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

      const old = await tx.loyaltyRule.findUniqueOrThrow({ where: { id } });
      const updated = await tx.loyaltyRule.update({
        where: {
          id,
        },
        data: {
          status,
        },
        include: loyaltyRuleInclude,
      });
      await createAuditLog({ tx, salonId, userId: actor.userId, module: "LOYALTY", action: "STATUS_CHANGE",
        entityId: id, description: `Admin ${status ? "activated" : "deactivated"} loyalty rule`,
        oldData: { status: old.status }, newData: { status: updated.status },
        ipAddress: actor.ipAddress, userAgent: actor.userAgent });
      return updated;
    },
    {
      isolationLevel: "Serializable",
    }
  );
};
