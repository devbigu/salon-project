import { prisma } from "../../config/prisma.js";
export const SalonModel = {
    create: async (data) => {
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
};
//# sourceMappingURL=salon.model.js.map