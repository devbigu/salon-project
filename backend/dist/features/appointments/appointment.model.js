import { prisma } from "../../config/prisma.js";
export const AppointmentModel = {
    create: async (data) => {
        return prisma.appointment.create({
            data: {
                appointmentCode: data.appointmentCode,
                salonId: data.salonId,
                customerId: data.customerId,
                staffId: data.staffId,
                startTime: data.startTime,
                endTime: data.endTime,
                totalDurationMinutes: data.totalDurationMinutes,
                estimatedAmount: data.estimatedAmount,
                status: data.status || "SCHEDULED",
                ...(data.branchId ? { branchId: data.branchId } : {}),
                ...(data.bookingNote ? { bookingNote: data.bookingNote } : {}),
                ...(data.internalNote ? { internalNote: data.internalNote } : {}),
                services: {
                    create: data.services.map((service) => ({
                        service: {
                            connect: {
                                id: service.serviceId,
                            },
                        },
                        serviceName: service.serviceName,
                        price: service.price,
                        ...(service.durationValue !== undefined
                            ? { durationValue: service.durationValue }
                            : {}),
                        ...(service.durationUnit ? { durationUnit: service.durationUnit } : {}),
                    })),
                },
            },
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        customerCode: true,
                    },
                },
                staff: {
                    select: {
                        id: true,
                        name: true,
                        jobRole: true,
                    },
                },
                branch: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                services: {
                    include: {
                        service: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });
    },
    findAll: async () => {
        return prisma.appointment.findMany({
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
                customer: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        customerCode: true,
                    },
                },
                staff: {
                    select: {
                        id: true,
                        name: true,
                        jobRole: true,
                    },
                },
                services: true,
            },
            orderBy: {
                startTime: "asc",
            },
        });
    },
    findBySalon: async (salonId, filters) => {
        return prisma.appointment.findMany({
            where: {
                salonId,
                ...(filters?.branchId ? { branchId: filters.branchId } : {}),
                ...(filters?.staffId ? { staffId: filters.staffId } : {}),
                ...(filters?.customerId ? { customerId: filters.customerId } : {}),
                ...(filters?.status ? { status: filters.status } : {}),
                ...(filters?.dateFrom && filters?.dateTo
                    ? {
                        startTime: {
                            gte: filters.dateFrom,
                            lt: filters.dateTo,
                        },
                    }
                    : {}),
            },
            include: {
                branch: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                customer: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        customerCode: true,
                    },
                },
                staff: {
                    select: {
                        id: true,
                        name: true,
                        jobRole: true,
                    },
                },
                services: true,
            },
            orderBy: {
                startTime: "asc",
            },
        });
    },
    findById: async (id) => {
        return prisma.appointment.findUnique({
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
                customer: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        customerCode: true,
                        outstandingAmount: true,
                        walletBalance: true,
                    },
                },
                staff: {
                    select: {
                        id: true,
                        name: true,
                        jobRole: true,
                    },
                },
                services: {
                    include: {
                        service: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });
    },
    findByIdAndSalon: async (id, salonId) => {
        return prisma.appointment.findFirst({
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
                customer: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        customerCode: true,
                        outstandingAmount: true,
                        walletBalance: true,
                    },
                },
                staff: {
                    select: {
                        id: true,
                        name: true,
                        jobRole: true,
                    },
                },
                services: {
                    include: {
                        service: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });
    },
    findConflict: async (data) => {
        return prisma.appointment.findFirst({
            where: {
                staffId: data.staffId,
                status: {
                    notIn: ["CANCELLED", "NO_SHOW"],
                },
                startTime: {
                    lt: data.endTime,
                },
                endTime: {
                    gt: data.startTime,
                },
                ...(data.excludeAppointmentId
                    ? {
                        id: {
                            not: data.excludeAppointmentId,
                        },
                    }
                    : {}),
            },
        });
    },
    updateStatus: async (id, status) => {
        return prisma.appointment.update({
            where: {
                id,
            },
            data: {
                status,
            },
        });
    },
    updateBasicDetails: async (id, data) => {
        return prisma.appointment.update({
            where: {
                id,
            },
            data,
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                    },
                },
                staff: {
                    select: {
                        id: true,
                        name: true,
                        jobRole: true,
                    },
                },
                services: true,
            },
        });
    },
    delete: async (id) => {
        return prisma.appointment.delete({
            where: {
                id,
            },
        });
    },
    updateSchedule: async (id, data) => {
        return prisma.appointment.update({
            where: {
                id,
            },
            data: {
                startTime: data.startTime,
                endTime: data.endTime,
            },
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        customerCode: true,
                    },
                },
                staff: {
                    select: {
                        id: true,
                        name: true,
                        jobRole: true,
                    },
                },
                branch: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                services: {
                    include: {
                        service: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });
    },
    findInvoiceSourceById: async (id) => {
        return prisma.appointment.findUnique({
            where: { id },
            include: {
                salon: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        email: true,
                        addressLine1: true,
                        addressLine2: true,
                        city: true,
                        state: true,
                        country: true,
                        postalCode: true,
                    },
                },
                branch: {
                    select: {
                        id: true,
                        name: true,
                        addressLine1: true,
                        city: true,
                        state: true,
                        postalCode: true,
                        phone: true,
                    },
                },
                customer: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        email: true,
                        gst: true,
                    },
                },
                services: true,
            },
        });
    },
    findInvoiceSourceByIdAndSalon: async (id, salonId) => {
        return prisma.appointment.findFirst({
            where: {
                id,
                salonId,
            },
            include: {
                salon: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        email: true,
                        addressLine1: true,
                        addressLine2: true,
                        city: true,
                        state: true,
                        country: true,
                        postalCode: true,
                    },
                },
                branch: {
                    select: {
                        id: true,
                        name: true,
                        addressLine1: true,
                        city: true,
                        state: true,
                        postalCode: true,
                        phone: true,
                    },
                },
                customer: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        email: true,
                        gst: true,
                    },
                },
                services: true,
            },
        });
    },
    createStatusHistory: async (data) => {
        return prisma.appointmentStatusHistory.create({
            data: {
                appointmentId: data.appointmentId,
                ...(data.oldStatus ? { oldStatus: data.oldStatus } : {}),
                newStatus: data.newStatus,
                ...(data.note ? { note: data.note } : {}),
                ...(data.changedById ? { changedById: data.changedById } : {}),
            },
        });
    },
    updateStatusWithHistory: async (id, data) => {
        return prisma.$transaction(async (tx) => {
            const appointment = await tx.appointment.update({
                where: {
                    id,
                },
                data: {
                    status: data.newStatus,
                },
                include: {
                    customer: {
                        select: {
                            id: true,
                            name: true,
                            phone: true,
                            customerCode: true,
                        },
                    },
                    staff: {
                        select: {
                            id: true,
                            name: true,
                            jobRole: true,
                        },
                    },
                    branch: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    services: true,
                    statusHistory: {
                        orderBy: {
                            createdAt: "desc",
                        },
                    },
                },
            });
            await tx.appointmentStatusHistory.create({
                data: {
                    appointmentId: id,
                    oldStatus: data.oldStatus,
                    newStatus: data.newStatus,
                    ...(data.note ? { note: data.note } : {}),
                    ...(data.changedById ? { changedById: data.changedById } : {}),
                },
            });
            return appointment;
        });
    },
    findStatusHistory: async (appointmentId) => {
        return prisma.appointmentStatusHistory.findMany({
            where: {
                appointmentId,
            },
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
                createdAt: "asc",
            },
        });
    },
};
