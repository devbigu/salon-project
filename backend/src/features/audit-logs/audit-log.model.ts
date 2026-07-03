import { prisma } from "../../config/prisma.js";
import { Prisma } from "../../generated/prisma/client.js";

export const AuditLogModel = {
  create: (
    data: Prisma.AuditLogUncheckedCreateInput,
    tx?: Prisma.TransactionClient
  ) => (tx ?? prisma).auditLog.create({ data }),

  list: (
    where: Prisma.AuditLogWhereInput,
    page: { skip: number; take: number }
  ) =>
    prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        include: {
          salon: { select: { id: true, name: true } },
          branch: { select: { id: true, name: true } },
          user: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: page.skip,
        take: page.take,
      }),
      prisma.auditLog.count({ where }),
    ]),

  find: (where: Prisma.AuditLogWhereInput) =>
    prisma.auditLog.findFirst({
      where,
      include: {
        salon: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    }),
};
