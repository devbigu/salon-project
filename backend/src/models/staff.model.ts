import { prisma } from "../config/prisma.js";

export const StaffModel = {
    create: async (data:{
        name: string, 
        email: string,
        phone? : string,
        jobRole : string,
        workingFrom: string,
        workingTo: string,
        weekOff : string,
        salonId: string,
        relationshipManagerId?: string;

    })=>{
        return prisma.staff.create({
            data
        })
    },
    
    findBySalon: async (salonId: string) => {
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
}