import { prisma } from "../../config/prisma.js";

export const StaffModel = {
  create: async (data: {
    name: string;
    email: string;
    phone?: string;
    jobRole: string;
    workingFrom: string;
    workingTo: string;
    weekOff: string;
    salonId: string;
    branchId?: string;
    reportingManagerId?: string;
  }) => {
    return prisma.staff.create({
      data,
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        reportingManager: {
          select: {
            id: true,
            name: true,
            jobRole: true,
          },
        },
      },
    });
  },

  findBySalon: async (salonId: string) => {
    return prisma.staff.findMany({
      where: {
        salonId,
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        reportingManager: {
          select: {
            id: true,
            name: true,
            jobRole: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  findAll: async () => {
    return prisma.staff.findMany({
      include: {
        salon: {
          select: {
            id: true,
            name: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        reportingManager: {
          select: {
            id: true,
            name: true,
            jobRole: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },
  findById: async (id: string) => {
  return prisma.staff.findUnique({
    where: { id },
    include: {
      salon: {
        select: {
          id: true,
          name: true,
        },
      },
      branch: {
        select: {
          id: true,
          name: true,
        },
      },
      reportingManager: {
        select: {
          id: true,
          name: true,
          jobRole: true,
        },
      },
    },
  });
},

findByIdAndSalon: async (id: string, salonId: string) => {
  return prisma.staff.findFirst({
    where: {
      id,
      salonId,
    },
    include: {
      branch: {
        select: {
          id: true,
          name: true,
        },
      },
      reportingManager: {
        select: {
          id: true,
          name: true,
          jobRole: true,
        },
      },
    },
  });
},

update: async (
  id: string,
  data: {
    name?: string;
    email?: string;
    phone?: string;
    jobRole?: string;
    workingFrom?: string;
    workingTo?: string;
    weekOff?: string;
    branchId?: string | null;
    reportingManagerId?: string | null;
  }
) => {
  return prisma.staff.update({
    where: { id },
    data,
  });
},

updateStatus: async (id: string, status: boolean) => {
  return prisma.staff.update({
    where: { id },
    data: { status },
  });
},

delete: async (id: string) => {
  return prisma.staff.delete({
    where: { id },
  });
},
};
