import { prisma } from "../../config/prisma.js";
import type { LeaveStatus, LeaveType } from "../../generated/prisma/enums.js";

const leaveInclude = {
  staff: {
    select: {
      id: true,
      staffCode: true,
      name: true,
      jobRole: true,
    },
  },
  branch: {
    select: {
      id: true,
      name: true,
    },
  },
  approvedBy: {
    select: {
      id: true,
      name: true,
      role: true,
    },
  },
} as const;

export const LeaveModel = {
  findStaffById: async (id: string) =>
    prisma.staff.findUnique({ where: { id } }),

  findStaffByUserId: async (userId: string) =>
    prisma.staff.findUnique({ where: { userId } }),

  findBranchById: async (id: string) =>
    prisma.branch.findUnique({ where: { id } }),

  findOverlap: async (data: {
    staffId: string;
    startDate: Date;
    endDate: Date;
  }) => {
    return prisma.staffLeave.findFirst({
      where: {
        staffId: data.staffId,
        status: { in: ["PENDING", "APPROVED"] },
        startDate: { lte: data.endDate },
        endDate: { gte: data.startDate },
      },
    });
  },

  create: async (data: {
    salonId: string;
    staffId: string;
    leaveType: LeaveType;
    startDate: Date;
    endDate: Date;
    totalDays: number;
    branchId?: string;
    reason?: string;
  }) => {
    return prisma.staffLeave.create({
      data: {
        salonId: data.salonId,
        staffId: data.staffId,
        leaveType: data.leaveType,
        startDate: data.startDate,
        endDate: data.endDate,
        totalDays: data.totalDays,
        ...(data.branchId ? { branchId: data.branchId } : {}),
        ...(data.reason ? { reason: data.reason } : {}),
      },
      include: leaveInclude,
    });
  },

  findById: async (id: string) => {
    return prisma.staffLeave.findUnique({
      where: { id },
      include: leaveInclude,
    });
  },

  findMany: async (filters: {
    salonId?: string;
    branchId?: string;
    staffId?: string;
    status?: LeaveStatus;
    leaveType?: LeaveType;
    from?: Date;
    to?: Date;
  }) => {
    return prisma.staffLeave.findMany({
      where: {
        ...(filters.salonId ? { salonId: filters.salonId } : {}),
        ...(filters.branchId ? { branchId: filters.branchId } : {}),
        ...(filters.staffId ? { staffId: filters.staffId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.leaveType ? { leaveType: filters.leaveType } : {}),
        ...(filters.from ? { endDate: { gte: filters.from } } : {}),
        ...(filters.to ? { startDate: { lte: filters.to } } : {}),
      },
      include: leaveInclude,
      orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
    });
  },

  transitionPending: async (
    id: string,
    data:
      | { status: "APPROVED"; approvedById: string; approvedAt: Date }
      | { status: "REJECTED"; rejectionReason?: string }
      | { status: "CANCELLED" }
  ) => {
    const result = await prisma.staffLeave.updateMany({
      where: { id, status: "PENDING" },
      data,
    });

    if (result.count === 0) {
      return null;
    }

    return prisma.staffLeave.findUnique({
      where: { id },
      include: leaveInclude,
    });
  },
};
