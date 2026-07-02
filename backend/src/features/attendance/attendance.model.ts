import { prisma } from "../../config/prisma.js";
import type { AttendanceStatus } from "../../generated/prisma/enums.js";

const attendanceInclude = {
  staff: {
    select: {
      id: true,
      staffCode: true,
      name: true,
      jobRole: true,
      workingFrom: true,
      workingTo: true,
      weekOff: true,
    },
  },
  branch: {
    select: {
      id: true,
      name: true,
    },
  },
  markedBy: {
    select: {
      id: true,
      name: true,
      role: true,
    },
  },
} as const;

export const AttendanceModel = {
  findStaffById: async (id: string) => {
    return prisma.staff.findUnique({ where: { id } });
  },

  findStaffByUserId: async (userId: string) => {
    return prisma.staff.findUnique({ where: { userId } });
  },

  findBranchById: async (id: string) => {
    return prisma.branch.findUnique({ where: { id } });
  },

  findSalaryConfigForDate: async (staffId: string, date: Date) => {
    return prisma.staffSalaryConfig.findFirst({
      where: {
        staffId,
        effectiveFrom: { lte: date },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: date } }],
      },
      select: { lateGraceMinutes: true },
      orderBy: { effectiveFrom: "desc" },
    });
  },

  upsertCheckIn: async (data: {
    salonId: string;
    staffId: string;
    date: Date;
    checkInTime: Date;
    status: AttendanceStatus;
    lateMinutes: number;
    branchId?: string;
    note?: string;
    markedById?: string;
  }) => {
    return prisma.staffAttendance.upsert({
      where: {
        salonId_staffId_date: {
          salonId: data.salonId,
          staffId: data.staffId,
          date: data.date,
        },
      },
      create: {
        salonId: data.salonId,
        staffId: data.staffId,
        date: data.date,
        checkInTime: data.checkInTime,
        status: data.status,
        lateMinutes: data.lateMinutes,
        ...(data.branchId ? { branchId: data.branchId } : {}),
        ...(data.note !== undefined ? { note: data.note } : {}),
        ...(data.markedById ? { markedById: data.markedById } : {}),
      },
      update: {
        checkInTime: data.checkInTime,
        status: data.status,
        lateMinutes: data.lateMinutes,
        ...(data.branchId ? { branchId: data.branchId } : {}),
        ...(data.note !== undefined ? { note: data.note } : {}),
        ...(data.markedById ? { markedById: data.markedById } : {}),
      },
      include: attendanceInclude,
    });
  },

  findByStaffAndDate: async (salonId: string, staffId: string, date: Date) => {
    return prisma.staffAttendance.findUnique({
      where: {
        salonId_staffId_date: { salonId, staffId, date },
      },
    });
  },

  checkOut: async (id: string, checkOutTime: Date, markedById?: string) => {
    return prisma.staffAttendance.update({
      where: { id },
      data: {
        checkOutTime,
        ...(markedById ? { markedById } : {}),
      },
      include: attendanceInclude,
    });
  },

  upsertManual: async (data: {
    salonId: string;
    staffId: string;
    date: Date;
    status: AttendanceStatus;
    lateMinutes: number;
    branchId?: string;
    checkInTime?: Date | null;
    checkOutTime?: Date | null;
    note?: string | null;
    markedById?: string;
  }) => {
    const values = {
      status: data.status,
      lateMinutes: data.lateMinutes,
      ...(data.branchId ? { branchId: data.branchId } : {}),
      ...(data.checkInTime !== undefined ? { checkInTime: data.checkInTime } : {}),
      ...(data.checkOutTime !== undefined ? { checkOutTime: data.checkOutTime } : {}),
      ...(data.note !== undefined ? { note: data.note } : {}),
      ...(data.markedById ? { markedById: data.markedById } : {}),
    };

    return prisma.staffAttendance.upsert({
      where: {
        salonId_staffId_date: {
          salonId: data.salonId,
          staffId: data.staffId,
          date: data.date,
        },
      },
      create: {
        salonId: data.salonId,
        staffId: data.staffId,
        date: data.date,
        ...values,
      },
      update: values,
      include: attendanceInclude,
    });
  },

  findMany: async (filters: {
    salonId?: string;
    branchId?: string;
    staffId?: string;
    status?: AttendanceStatus;
    dateFrom?: Date;
    dateTo?: Date;
  }) => {
    return prisma.staffAttendance.findMany({
      where: {
        ...(filters.salonId ? { salonId: filters.salonId } : {}),
        ...(filters.branchId ? { branchId: filters.branchId } : {}),
        ...(filters.staffId ? { staffId: filters.staffId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.dateFrom || filters.dateTo
          ? {
              date: {
                ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
                ...(filters.dateTo ? { lte: filters.dateTo } : {}),
              },
            }
          : {}),
      },
      include: attendanceInclude,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });
  },
};
