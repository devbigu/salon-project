import { prisma } from "../../config/prisma.js"

export const UserModel = {
  findByEmail: async (email: string) => {
    return prisma.user.findUnique({
      where: { email }
    })
  },

  createSalonAdmin: async (data: {
    name: string;
    email: string;
    phone_number: string;
    passwordHash: string;
    salonId: string;
  }) => {
    return prisma.user.create({
      data: {
        ...data,
        role: "SALON_ADMIN",
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone_number: true,
        role: true,
        salonId: true,
        createdAt: true,
      },
    });
  },

  findByPhoneNumber: async (phone_number: string) => {
    return prisma.user.findUnique({
      where: { phone_number },
    });
  },


  create: async (data: {
    name: string;
    email: string;
    phone_number?: string;
    passwordHash: string;
    role?: "SUPER_ADMIN" | "SALON_ADMIN" | "STAFF";
    salonId?: string;
  }) => {
    return prisma.user.create({
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone_number: true,
        role: true,
        salonId: true,
        createdAt: true,
      },
    });
  },
}
