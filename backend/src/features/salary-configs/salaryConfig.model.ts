import { prisma } from "../../config/prisma.js";
import type { LatePenaltyType, SalaryType } from "../../generated/prisma/enums.js";
import type { Prisma } from "../../generated/prisma/client.js";

const include = {
  staff: { select: { id: true, staffCode: true, name: true, jobRole: true } },
  branch: { select: { id: true, name: true } },
  salon: { select: { id: true, name: true } },
} as const;

export type SalaryConfigData = {
  salonId: string;
  staffId: string;
  baseSalary: number;
  workingDaysPerMonth: number;
  effectiveFrom: Date;
  branchId?: string;
  salaryType?: SalaryType;
  paidLeavesAllowed?: number;
  lateGraceMinutes?: number;
  latePenaltyType?: LatePenaltyType;
  latePenaltyAmount?: number;
  serviceCommissionPercentage?: number;
  serviceMinimumWorkThreshold?: number;
  retailCommissionPercentage?: number;
  retailMinimumSalesThreshold?: number;
  status?: boolean;
  effectiveTo?: Date | null;
};

export const SalaryConfigModel = {
  findStaff: (id: string) => prisma.staff.findUnique({ where: { id } }),
  findStaffByUser: (userId: string) => prisma.staff.findUnique({ where: { userId } }),
  findBranch: (id: string) => prisma.branch.findUnique({ where: { id } }),

  create: (data: SalaryConfigData, tx?: Prisma.TransactionClient) => {
    const run = async (client: Prisma.TransactionClient) => {
      if (data.status !== false) {
        await client.staffSalaryConfig.updateMany({
          where: { salonId: data.salonId, staffId: data.staffId, status: true },
          data: {
            status: false,
            effectiveTo: new Date(data.effectiveFrom.getTime() - 1),
          },
        });
      }

      return client.staffSalaryConfig.create({ data, include });
    };
    return tx ? run(tx) : prisma.$transaction(run);
  },

  findActiveForStaff: (staffId: string) =>
    prisma.staffSalaryConfig.findFirst({
      where: { staffId, status: true },
      include,
      orderBy: { effectiveFrom: "desc" },
    }),

  findById: (id: string) =>
    prisma.staffSalaryConfig.findUnique({ where: { id }, include }),

  update: (id: string, data: Partial<Omit<SalaryConfigData, "salonId" | "staffId">>, tx?: Prisma.TransactionClient) =>
    (tx ?? prisma).staffSalaryConfig.update({ where: { id }, data, include }),

  setStatus: (id: string, salonId: string, staffId: string, status: boolean, tx?: Prisma.TransactionClient) => {
    const run = async (client: Prisma.TransactionClient) => {
      if (status) {
        await client.staffSalaryConfig.updateMany({
          where: { salonId, staffId, status: true, id: { not: id } },
          data: { status: false, effectiveTo: new Date() },
        });
      }
      return client.staffSalaryConfig.update({
        where: { id },
        data: {
          status,
          ...(status ? { effectiveTo: null } : { effectiveTo: new Date() }),
        },
        include,
      });
    };
    return tx ? run(tx) : prisma.$transaction(run);
  },
};
