import { prisma } from "../../config/prisma.js";

export const CustomerModel = {
  create: async (data: {
    name: string;
    phone: string;
    email?: string;
    gender?: string;
    dateOfBirth?: Date;
    notes?: string;
    salonId: string;
    branchId?: string;
  }) => {
    return prisma.customer.create({
      data,
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
      },
    });
  },

  findAll: async () => {
    return prisma.customer.findMany({
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
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  findBySalon: async (salonId: string) => {
    return prisma.customer.findMany({
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
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  findById: async (id: string) => {
    return prisma.customer.findUnique({
      where: {
        id,
      },
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
      },
    });
  },

  findByIdAndSalon: async (id: string, salonId: string) => {
    return prisma.customer.findFirst({
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
      },
    });
  },

  findByPhoneAndSalon: async (phone: string, salonId: string) => {
    return prisma.customer.findFirst({
      where: {
        phone,
        salonId,
      },
    });
  },

  update: async (
    id: string,
    data: {
      name?: string;
      phone?: string;
      email?: string | null;
      gender?: string | null;
      dateOfBirth?: Date | null;
      notes?: string | null;
      branchId?: string | null;
    }
  ) => {
    return prisma.customer.update({
      where: {
        id,
      },
      data,
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },

  delete: async (id: string) => {
    return prisma.customer.delete({
      where: {
        id,
      },
    });
  },
};