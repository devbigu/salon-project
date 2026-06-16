import { prisma } from "../../config/prisma.js";

export const BranchModel = {
  create: async (data: {
    name: string;
    salonId: string;
    addressLine1?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    phone?: string;
  }) => {
    return prisma.branch.create({
      data,
    });
  },

  findBySalon: async (salonId: string) => {
    return prisma.branch.findMany({
      where: {
        salonId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  findAll: async () => {
    return prisma.branch.findMany({
      include: {
        salon: {
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
    return prisma.branch.findUnique({
      where: {
        id,
      },
    });
  },

  findByIdAndSalon: async (id: string, salonId: string) => {
    return prisma.branch.findFirst({
      where: {
        id,
        salonId,
      },
    });
  },

  findByIdandSalon: async (id: string, salonId: string) => {
    return BranchModel.findByIdAndSalon(id, salonId);
  },

  update: async (
    id: string,
    data: {
      name?: string;
      addressLine1?: string | null;
      city?: string | null;
      state?: string | null;
      postalCode?: string | null;
      phone?: string | null;
    }
  ) => {
    return prisma.branch.update({
      where: {
        id,
      },
      data,
    });
  },

  delete: async (id: string) => {
    return prisma.branch.delete({
      where: {
        id,
      },
    });
  },
};
