import { prisma } from "../../config/prisma.js";

export const SalonModel = {
  create: async (data: {
    name: string;
    email?: string;
    phone?: string;
    addressLine1?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    timezone?: string;
  }) => {
    return prisma.salon.create({
      data,
    });
  },

  findAll: async () => {
    return prisma.salon.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  findById: async (id: string) => {
    return prisma.salon.findUnique({
      where: {
        id,
      },
    });
  },
};
