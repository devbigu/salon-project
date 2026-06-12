import { prisma } from "../config/prisma.js";
export const StaffModel = {
    create: async (data) => {
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
    findBySalon: async (salonId) => {
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
    findById: async (id) => {
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
    findByIdAndSalon: async (id, salonId) => {
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
    update: async (id, data) => {
        return prisma.staff.update({
            where: { id },
            data,
        });
    },
    updateStatus: async (id, status) => {
        return prisma.staff.update({
            where: { id },
            data: { status },
        });
    },
    delete: async (id) => {
        return prisma.staff.delete({
            where: { id },
        });
    },
};
//# sourceMappingURL=staff.model.js.map