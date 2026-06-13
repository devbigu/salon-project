import { prisma } from "../../config/prisma.js";
export const CustomerModel = {
    create: async (data) => {
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
    findBySalon: async (salonId) => {
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
    findById: async (id) => {
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
    findByIdAndSalon: async (id, salonId) => {
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
    findByPhoneAndSalon: async (phone, salonId) => {
        return prisma.customer.findFirst({
            where: {
                phone,
                salonId,
            },
        });
    },
    update: async (id, data) => {
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
    delete: async (id) => {
        return prisma.customer.delete({
            where: {
                id,
            },
        });
    },
};
//# sourceMappingURL=customer.model.js.map