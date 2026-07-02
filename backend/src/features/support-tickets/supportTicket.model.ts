import { prisma } from "../../config/prisma.js";

export const SUPPORT_TICKET_CATEGORIES = [
  "LOGIN_ISSUE",
  "CUSTOMER_MODULE",
  "APPOINTMENT_MODULE",
  "STAFF_MODULE",
  "SERVICE_MODULE",
  "BILLING_INVOICE",
  "PAYMENT_MODULE",
  "REPORTS",
  "PERFORMANCE",
  "BUG",
  "OTHER",
] as const;

export const SUPPORT_TICKET_PRIORITIES = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
] as const;

export const SUPPORT_TICKET_STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING_FOR_USER",
  "RESOLVED",
  "CLOSED",
  "REJECTED",
] as const;

export type SupportTicketCategory =
  (typeof SUPPORT_TICKET_CATEGORIES)[number];
export type SupportTicketPriority =
  (typeof SUPPORT_TICKET_PRIORITIES)[number];
export type SupportTicketStatus = (typeof SUPPORT_TICKET_STATUSES)[number];

type TicketDetails = {
  ticketCode: string;
  reporterName?: string;
  reporterEmail: string;
  reporterPhone?: string;
  title: string;
  description: string;
  category?: SupportTicketCategory;
  priority?: SupportTicketPriority;
  pageUrl?: string;
  browserInfo?: string;
  errorMessage?: string;
};

const ticketInclude = {
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
  reporter: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
  assignedTo: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
  messages: {
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc" as const,
    },
  },
  statusHistory: {
    include: {
      changedBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc" as const,
    },
  },
};

export const SupportTicketModel = {
  createPublicTicket: async (data: TicketDetails) => {
    return prisma.supportTicket.create({
      data: {
        ticketCode: data.ticketCode,
        reporterEmail: data.reporterEmail,
        title: data.title,
        description: data.description,
        category: data.category ?? "OTHER",
        priority: data.priority ?? "MEDIUM",
        status: "OPEN",
        source: "LOGIN_PAGE",
        ...(data.reporterName ? { reporterName: data.reporterName } : {}),
        ...(data.reporterPhone ? { reporterPhone: data.reporterPhone } : {}),
        ...(data.pageUrl ? { pageUrl: data.pageUrl } : {}),
        ...(data.browserInfo ? { browserInfo: data.browserInfo } : {}),
        ...(data.errorMessage ? { errorMessage: data.errorMessage } : {}),
        statusHistory: {
          create: {
            newStatus: "OPEN",
            note: "Ticket created from login page",
          },
        },
      },
      include: ticketInclude,
    });
  },

  createDashboardTicket: async (
    data: TicketDetails & {
      reporterId: string;
      salonId?: string;
      branchId?: string;
    }
  ) => {
    return prisma.supportTicket.create({
      data: {
        ticketCode: data.ticketCode,
        reporterId: data.reporterId,
        reporterEmail: data.reporterEmail,
        title: data.title,
        description: data.description,
        category: data.category ?? "OTHER",
        priority: data.priority ?? "MEDIUM",
        status: "OPEN",
        source: "DASHBOARD",
        ...(data.salonId ? { salonId: data.salonId } : {}),
        ...(data.branchId ? { branchId: data.branchId } : {}),
        ...(data.reporterName ? { reporterName: data.reporterName } : {}),
        ...(data.reporterPhone ? { reporterPhone: data.reporterPhone } : {}),
        ...(data.pageUrl ? { pageUrl: data.pageUrl } : {}),
        ...(data.browserInfo ? { browserInfo: data.browserInfo } : {}),
        ...(data.errorMessage ? { errorMessage: data.errorMessage } : {}),
        statusHistory: {
          create: {
            newStatus: "OPEN",
            changedById: data.reporterId,
            note: "Ticket created from dashboard",
          },
        },
      },
      include: ticketInclude,
    });
  },

  findAll: async (filters?: {
    status?: SupportTicketStatus;
    priority?: SupportTicketPriority;
    category?: SupportTicketCategory;
    skip?: number;
    take?: number;
  }) => {
    const where = {
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.priority ? { priority: filters.priority } : {}),
        ...(filters?.category ? { category: filters.category } : {}),
    };
    const [data, total] = await prisma.$transaction([
      prisma.supportTicket.findMany({
        where,
        include: ticketInclude,
        orderBy: { createdAt: "desc" },
        ...(filters?.skip !== undefined ? { skip: filters.skip } : {}),
        ...(filters?.take !== undefined ? { take: filters.take } : {}),
      }),
      prisma.supportTicket.count({ where }),
    ]);
    return { data, total };
  },

  findById: async (id: string) => {
    return prisma.supportTicket.findUnique({
      where: { id },
      include: ticketInclude,
    });
  },

  findByIdAndSalon: async (
    id: string,
    salonId: string,
    branchId?: string
  ) => {
    return prisma.supportTicket.findFirst({
      where: {
        id,
        salonId,
        ...(branchId ? { branchId } : {}),
      },
      include: ticketInclude,
    });
  },

  findMyTickets: async (reporterId: string) => {
    return prisma.supportTicket.findMany({
      where: { reporterId },
      include: ticketInclude,
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  findByTicketCodeAndEmail: async (
    ticketCode: string,
    reporterEmail: string
  ) => {
    return prisma.supportTicket.findFirst({
      where: {
        ticketCode,
        reporterEmail,
        source: "LOGIN_PAGE",
      },
      include: {
        messages: {
          where: {
            isInternalNote: false,
          },
          select: {
            id: true,
            senderEmail: true,
            message: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        statusHistory: {
          select: {
            id: true,
            oldStatus: true,
            newStatus: true,
            note: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });
  },

  addMessage: async (data: {
    ticketId: string;
    message: string;
    senderId?: string;
    senderEmail?: string;
    isInternalNote?: boolean;
  }) => {
    await prisma.supportTicketMessage.create({
      data: {
        ticketId: data.ticketId,
        message: data.message,
        isInternalNote: data.isInternalNote ?? false,
        ...(data.senderId ? { senderId: data.senderId } : {}),
        ...(data.senderEmail ? { senderEmail: data.senderEmail } : {}),
      },
    });

    return prisma.supportTicket.findUnique({
      where: { id: data.ticketId },
      include: ticketInclude,
    });
  },

  updateStatusWithHistory: async (
    id: string,
    data: {
      oldStatus: SupportTicketStatus;
      newStatus: SupportTicketStatus;
      changedById: string;
      note?: string;
      resolutionNotes?: string;
    }
  ) => {
    return prisma.$transaction(async (tx) => {
      await tx.supportTicket.update({
        where: { id },
        data: {
          status: data.newStatus,
          ...((data.newStatus === "RESOLVED" ||
            data.newStatus === "CLOSED") &&
          data.resolutionNotes
            ? { resolutionNotes: data.resolutionNotes }
            : {}),
        },
      });

      await tx.supportTicketStatusHistory.create({
        data: {
          ticketId: id,
          oldStatus: data.oldStatus,
          newStatus: data.newStatus,
          changedById: data.changedById,
          ...(data.note ? { note: data.note } : {}),
        },
      });

      return tx.supportTicket.findUnique({
        where: { id },
        include: ticketInclude,
      });
    });
  },

  assignTicket: async (id: string, assignedToId: string) => {
    return prisma.supportTicket.update({
      where: { id },
      data: { assignedToId },
      include: ticketInclude,
    });
  },

  findUserById: async (id: string) => {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone_number: true,
        role: true,
        salonId: true,
        branchId: true,
      },
    });
  },
};
