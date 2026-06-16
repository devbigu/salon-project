import { prisma } from "../../config/prisma.js";
export const BranchModel = {
    create: async (data) => {
        return prisma.branch.create({
            data,
        });
    },
    findBySalon: async (salonId) => {
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
    findById: async (id) => {
        return prisma.branch.findUnique({
            where: {
                id,
            },
        });
    },
    findByIdAndSalon: async (id, salonId) => {
        return prisma.branch.findFirst({
            where: {
                id,
                salonId,
            },
        });
    },
    findByIdandSalon: async (id, salonId) => {
        return BranchModel.findByIdAndSalon(id, salonId);
    },
    update: async (id, data) => {
        return prisma.branch.update({
            where: {
                id,
            },
            data,
        });
    },
    delete: async (id) => {
        return prisma.branch.delete({
            where: {
                id,
            },
        });
    },
};
