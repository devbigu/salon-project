import { prisma } from "../config/prisma.js";
export const StaffModel = {
    create: async (data) => {
        return prisma.staff.create({
            data
        });
    },
    findBySalon: async (salonId) => {
        return prisma.staff.findMany({
            where: { salonId },
            include: {
                relationshipManager: {
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
};
//# sourceMappingURL=staff.model.js.map