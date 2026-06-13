import { prisma } from "../../config/prisma.js";
export const UserModel = {
    findByEmail: async (email) => {
        return prisma.user.findUnique({
            where: { email }
        });
    },
    createSalonAdmin: async (data) => {
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
    findByPhoneNumber: async (phone_number) => {
        return prisma.user.findUnique({
            where: { phone_number },
        });
    },
    create: async (data) => {
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
};
//# sourceMappingURL=user.model.js.map