import { prisma } from "../../config/prisma.js";
export const InvoiceModel = {
    create: async (data) => {
        return prisma.invoice.create({
            data: {
                invoiceCode: data.invoiceCode,
                salonId: data.salonId,
                ...(data.branchId ? { branchId: data.branchId } : {}),
                customerId: data.customerId,
                ...(data.appointmentId ? { appointmentId: data.appointmentId } : {}),
                invoiceType: data.invoiceType || "BILL_OF_SUPPLY",
                salonName: data.salonName,
                ...(data.salonPhone ? { salonPhone: data.salonPhone } : {}),
                ...(data.salonEmail ? { salonEmail: data.salonEmail } : {}),
                ...(data.salonAddress ? { salonAddress: data.salonAddress } : {}),
                ...(data.salonGst ? { salonGst: data.salonGst } : {}),
                customerName: data.customerName,
                ...(data.customerPhone ? { customerPhone: data.customerPhone } : {}),
                ...(data.customerEmail ? { customerEmail: data.customerEmail } : {}),
                ...(data.customerAddress
                    ? { customerAddress: data.customerAddress }
                    : {}),
                ...(data.customerGst ? { customerGst: data.customerGst } : {}),
                subtotalAmount: data.subtotalAmount,
                discountAmount: data.discountAmount,
                processingFeeAmount: data.processingFeeAmount,
                taxAmount: data.taxAmount,
                totalAmount: data.totalAmount,
                paidAmount: data.paidAmount || 0,
                balanceAmount: data.balanceAmount,
                status: data.status || "ISSUED",
                paymentStatus: data.paymentStatus || "UNPAID",
                ...(data.billingNote ? { billingNote: data.billingNote } : {}),
                ...(data.footerNote ? { footerNote: data.footerNote } : {}),
                items: {
                    create: data.items.map((item) => ({
                        ...(item.serviceId ? { serviceId: item.serviceId } : {}),
                        ...(item.itemCode ? { itemCode: item.itemCode } : {}),
                        description: item.description,
                        serviceName: item.serviceName,
                        quantity: item.quantity || 1,
                        unitPrice: item.unitPrice,
                        discountAmount: item.discountAmount || 0,
                        taxPercent: item.taxPercent || 0,
                        taxAmount: item.taxAmount || 0,
                        lineTotal: item.lineTotal,
                    })),
                },
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
                        loyaltyPoints: true,
                        membership: {
                            select: {
                                id: true,
                                name: true,
                                discountPercentage: true,
                                status: true,
                            },
                        },
                    },
                },
                appointment: {
                    select: {
                        id: true,
                        appointmentCode: true,
                        status: true,
                    },
                },
                items: true,
                payments: true,
            },
        });
    },
    findAll: async () => {
        return prisma.invoice.findMany({
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
                        loyaltyPoints: true,
                        membership: {
                            select: {
                                id: true,
                                name: true,
                                discountPercentage: true,
                                status: true,
                            },
                        },
                    },
                },
                items: true,
                payments: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
    },
    findBySalon: async (salonId, filters) => {
        return prisma.invoice.findMany({
            where: {
                salonId,
                ...(filters?.branchId ? { branchId: filters.branchId } : {}),
                ...(filters?.customerId ? { customerId: filters.customerId } : {}),
                ...(filters?.paymentStatus
                    ? { paymentStatus: filters.paymentStatus }
                    : {}),
                ...(filters?.status ? { status: filters.status } : {}),
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
                        loyaltyPoints: true,
                        membership: {
                            select: {
                                id: true,
                                name: true,
                                discountPercentage: true,
                                status: true,
                            },
                        },
                    },
                },
                items: true,
                payments: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
    },
    findById: async (id) => {
        return prisma.invoice.findUnique({
            where: {
                id,
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
                        customerCode: true,
                        outstandingAmount: true,
                        walletBalance: true,
                        loyaltyPoints: true,
                        membership: {
                            select: {
                                id: true,
                                name: true,
                                discountPercentage: true,
                                status: true,
                            },
                        },
                    },
                },
                appointment: {
                    select: {
                        id: true,
                        appointmentCode: true,
                        status: true,
                        startTime: true,
                        endTime: true,
                    },
                },
                items: true,
                payments: true,
            },
        });
    },
    findByIdAndSalon: async (id, salonId) => {
        return prisma.invoice.findFirst({
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
                        email: true,
                        gst: true,
                        customerCode: true,
                        outstandingAmount: true,
                        walletBalance: true,
                        loyaltyPoints: true,
                        membership: {
                            select: {
                                id: true,
                                name: true,
                                discountPercentage: true,
                                status: true,
                            },
                        },
                    },
                },
                appointment: {
                    select: {
                        id: true,
                        appointmentCode: true,
                        status: true,
                        startTime: true,
                        endTime: true,
                    },
                },
                items: true,
                payments: true,
            },
        });
    },
    findByAppointmentIdAndSalon: async (appointmentId, salonId) => {
        return prisma.invoice.findFirst({
            where: {
                appointmentId,
                salonId,
            },
        });
    },
    updatePaymentSummary: async (id, data) => {
        return prisma.invoice.update({
            where: {
                id,
            },
            data: {
                paidAmount: data.paidAmount,
                balanceAmount: data.balanceAmount,
                paymentStatus: data.paymentStatus,
            },
            include: {
                items: true,
                payments: true,
            },
        });
    },
    cancel: async (id) => {
        return prisma.invoice.update({
            where: {
                id,
            },
            data: {
                status: "CANCELLED",
            },
        });
    },
};
