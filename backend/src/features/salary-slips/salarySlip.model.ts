import { prisma } from "../../config/prisma.js";
import type { SalarySlipStatus } from "../../generated/prisma/enums.js";
import type { Prisma } from "../../generated/prisma/client.js";

export const salarySlipInclude = {
  salon: true,
  branch: { select: { id: true, name: true } },
  staff: {
    select: {
      id: true,
      staffCode: true,
      name: true,
      jobRole: true,
      userId: true,
    },
  },
  paidBy: { select: { id: true, name: true, role: true } },
} as const;

export const SalarySlipModel = {
  findStaff: (id: string) => prisma.staff.findUnique({ where: { id } }),
  findStaffByUser: (userId: string) => prisma.staff.findUnique({ where: { userId } }),
  findById: (id: string) =>
    prisma.salarySlip.findUnique({ where: { id }, include: salarySlipInclude }),
  findUniquePeriod: (salonId: string, staffId: string, month: number, year: number, tx?: Prisma.TransactionClient) =>
    (tx ?? prisma).salarySlip.findUnique({
      where: { salonId_staffId_month_year: { salonId, staffId, month, year } },
    }),
  findMany: (where: Prisma.SalarySlipWhereInput) =>
    prisma.salarySlip.findMany({
      where,
      include: salarySlipInclude,
      orderBy: [{ year: "desc" }, { month: "desc" }, { staff: { name: "asc" } }],
    }),
  saveGenerated: async (
    existingId: string | undefined,
    data: Prisma.SalarySlipUncheckedCreateInput,
    tx?: Prisma.TransactionClient
  ) => {
    const client = tx ?? prisma;
    if (existingId) {
      return client.salarySlip.update({
        where: { id: existingId },
        data: {
          ...data,
          status: "GENERATED",
          generatedAt: new Date(),
          paidAt: null,
          paidById: null,
        },
        include: salarySlipInclude,
      });
    }
    return client.salarySlip.create({ data, include: salarySlipInclude });
  },
  transition: async (
    id: string,
    from: SalarySlipStatus[],
    data: Prisma.SalarySlipUpdateManyMutationInput,
    tx?: Prisma.TransactionClient
  ) => {
    const client = tx ?? prisma;
    const result = await client.salarySlip.updateMany({
      where: { id, status: { in: from } },
      data,
    });
    return result.count
      ? client.salarySlip.findUnique({ where: { id }, include: salarySlipInclude })
      : null;
  },
};
