import { prisma } from "../config/prisma.js";

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

  findByIdandSalon: async(id: string, salonId: string)=>{
    return prisma.branch.findFirst({
        where:{
            id, salonId
        }
    })},
};