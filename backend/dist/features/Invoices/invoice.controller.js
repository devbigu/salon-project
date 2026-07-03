import {} from "express";
import { InvoiceModel } from "./invoice.model.js";
import { AppointmentModel } from "../appointments/appointment.model.js";
import { CustomerModel } from "../customers/customer.model.js";
import { InvoiceRetentionError, redeemInvoiceLoyalty, } from "./invoice-retention.service.js";
const INVOICE_TYPES = ["GST_INVOICE", "BILL_OF_SUPPLY"];
const INVOICE_STATUSES = ["DRAFT", "ISSUED", "CANCELLED"];
const PAYMENT_STATUSES = ["UNPAID", "PARTIALLY_PAID", "PAID"];
const isValidInvoiceType = (value) => {
    return INVOICE_TYPES.includes(value);
};
const isValidInvoiceStatus = (value) => {
    return INVOICE_STATUSES.includes(value);
};
const isValidPaymentStatus = (value) => {
    return PAYMENT_STATUSES.includes(value);
};
const generateInvoiceCode = () => {
    return `INV${Date.now()}`;
};
const getInvoiceIdParam = (req) => {
    const { id } = req.params;
    return typeof id === "string" ? id : null;
};
const getAppointmentIdParam = (req) => {
    const { appointmentId } = req.params;
    return typeof appointmentId === "string" ? appointmentId : null;
};
const buildAddress = (parts) => {
    return parts.filter(Boolean).join(", ");
};
const getExistingInvoiceByAccess = async (req, invoiceId) => {
    if (req.user?.role === "SUPER_ADMIN") {
        return InvoiceModel.findById(invoiceId);
    }
    const salonId = req.user?.salonId;
    if (!salonId) {
        return null;
    }
    return InvoiceModel.findByIdAndSalon(invoiceId, salonId);
};
export const createInvoiceFromAppointment = async (req, res) => {
    try {
        const appointmentId = getAppointmentIdParam(req);
        const { invoiceType, discountAmount, processingFeeAmount, taxPercent, billingNote, footerNote, } = req.body;
        if (!appointmentId) {
            return res.status(400).json({
                success: false,
                message: "Appointment ID is required",
            });
        }
        if (invoiceType && !isValidInvoiceType(invoiceType)) {
            return res.status(400).json({
                success: false,
                message: "Invalid invoice type",
            });
        }
        const appointment = req.user?.role === "SUPER_ADMIN"
            ? await AppointmentModel.findInvoiceSourceById(appointmentId)
            : req.user?.salonId
                ? await AppointmentModel.findInvoiceSourceByIdAndSalon(appointmentId, req.user.salonId)
                : null;
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found",
            });
        }
        if (appointment.status !== "COMPLETED") {
            return res.status(400).json({
                success: false,
                message: "Only completed appointments can be converted to invoice",
            });
        }
        const existingInvoice = await InvoiceModel.findByAppointmentIdAndSalon(appointment.id, appointment.salonId);
        if (existingInvoice) {
            return res.status(400).json({
                success: false,
                message: "Invoice already exists for this appointment",
            });
        }
        if (!appointment.services.length) {
            return res.status(400).json({
                success: false,
                message: "Appointment has no services",
            });
        }
        const finalInvoiceType = invoiceType && isValidInvoiceType(invoiceType)
            ? invoiceType
            : "BILL_OF_SUPPLY";
        const subtotalAmount = appointment.services.reduce((total, item) => {
            return total + Number(item.price);
        }, 0);
        const requestedManualDiscountAmount = Math.max(Number(discountAmount || 0), 0);
        const manualDiscountAmount = Number(Math.min(requestedManualDiscountAmount, subtotalAmount).toFixed(2));
        const membershipDiscountAmount = appointment.customer.membership?.status
            ? Number(Math.min((subtotalAmount *
                Number(appointment.customer.membership.discountPercentage)) /
                100, subtotalAmount - manualDiscountAmount).toFixed(2))
            : 0;
        const finalDiscountAmount = Number(Math.min(manualDiscountAmount + membershipDiscountAmount, subtotalAmount).toFixed(2));
        const finalProcessingFeeAmount = Math.max(Number(processingFeeAmount || 0), 0);
        const taxableAmount = Math.max(subtotalAmount - finalDiscountAmount + finalProcessingFeeAmount, 0);
        const finalTaxPercent = finalInvoiceType === "GST_INVOICE" ? Math.max(Number(taxPercent || 0), 0) : 0;
        const finalTaxAmount = Number(((taxableAmount * finalTaxPercent) / 100).toFixed(2));
        const totalAmount = Number((taxableAmount + finalTaxAmount).toFixed(2));
        const invoice = await InvoiceModel.create({
            invoiceCode: generateInvoiceCode(),
            salonId: appointment.salonId,
            ...(appointment.branchId ? { branchId: appointment.branchId } : {}),
            customerId: appointment.customerId,
            appointmentId: appointment.id,
            invoiceType: finalInvoiceType,
            salonName: appointment.salon.name,
            ...(appointment.salon.phone ? { salonPhone: appointment.salon.phone } : {}),
            ...(appointment.salon.email ? { salonEmail: appointment.salon.email } : {}),
            salonAddress: buildAddress([
                appointment.salon.addressLine1,
                appointment.salon.addressLine2,
                appointment.salon.city,
                appointment.salon.state,
                appointment.salon.country,
                appointment.salon.postalCode,
            ]),
            customerName: appointment.customer.name,
            ...(appointment.customer.phone
                ? { customerPhone: appointment.customer.phone }
                : {}),
            ...(appointment.customer.email
                ? { customerEmail: appointment.customer.email }
                : {}),
            ...(appointment.customer.gst
                ? { customerGst: appointment.customer.gst }
                : {}),
            subtotalAmount,
            discountAmount: finalDiscountAmount,
            processingFeeAmount: finalProcessingFeeAmount,
            taxAmount: finalTaxAmount,
            totalAmount,
            paidAmount: 0,
            balanceAmount: totalAmount,
            status: "ISSUED",
            paymentStatus: "UNPAID",
            ...(billingNote ? { billingNote } : {}),
            ...(footerNote ? { footerNote } : {}),
            items: appointment.services.map((item) => ({
                serviceId: item.serviceId,
                itemCode: item.serviceId.slice(0, 8),
                description: item.serviceName,
                serviceName: item.serviceName,
                quantity: 1,
                unitPrice: Number(item.price),
                discountAmount: 0,
                taxPercent: finalTaxPercent,
                taxAmount: finalInvoiceType === "GST_INVOICE"
                    ? Number(((Number(item.price) * finalTaxPercent) / 100).toFixed(2))
                    : 0,
                lineTotal: finalInvoiceType === "GST_INVOICE"
                    ? Number((Number(item.price) +
                        (Number(item.price) * finalTaxPercent) / 100).toFixed(2))
                    : Number(item.price),
            })),
        });
        await CustomerModel.increaseOutstandingWithTransaction({
            customerId: invoice.customerId,
            salonId: invoice.salonId,
            invoiceId: invoice.id,
            billNo: invoice.invoiceCode,
            amount: Number(invoice.totalAmount),
            narration: `Invoice generated: ${invoice.invoiceCode}`,
        });
        return res.status(201).json({
            success: true,
            message: "Invoice created successfully",
            data: {
                ...invoice,
                manualDiscountAmount,
                membershipDiscountAmount,
            },
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
export const getInvoices = async (req, res) => {
    try {
        const { branchId, customerId, status, paymentStatus } = req.query;
        if (status && !isValidInvoiceStatus(String(status))) {
            return res.status(400).json({
                success: false,
                message: "Invalid invoice status",
            });
        }
        if (paymentStatus && !isValidPaymentStatus(String(paymentStatus))) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment status",
            });
        }
        if (req.user?.role === "SUPER_ADMIN") {
            const invoices = await InvoiceModel.findAll();
            return res.status(200).json({
                success: true,
                message: "Invoices fetched successfully",
                data: invoices,
            });
        }
        if (!req.user?.salonId) {
            return res.status(400).json({
                success: false,
                message: "Salon ID is missing",
            });
        }
        const invoices = await InvoiceModel.findBySalon(req.user.salonId, {
            ...(branchId ? { branchId: String(branchId) } : {}),
            ...(customerId ? { customerId: String(customerId) } : {}),
            ...(status ? { status: String(status) } : {}),
            ...(paymentStatus
                ? { paymentStatus: String(paymentStatus) }
                : {}),
        });
        return res.status(200).json({
            success: true,
            message: "Invoices fetched successfully",
            data: invoices,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
export const getInvoiceById = async (req, res) => {
    try {
        const id = getInvoiceIdParam(req);
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Invoice ID is required",
            });
        }
        const invoice = await getExistingInvoiceByAccess(req, id);
        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: "Invoice not found",
            });
        }
        return res.status(200).json({
            success: true,
            message: "Invoice fetched successfully",
            data: invoice,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
export const cancelInvoice = async (req, res) => {
    try {
        const id = getInvoiceIdParam(req);
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Invoice ID is required",
            });
        }
        const existingInvoice = await getExistingInvoiceByAccess(req, id);
        if (!existingInvoice) {
            return res.status(404).json({
                success: false,
                message: "Invoice not found",
            });
        }
        if (existingInvoice.paymentStatus !== "UNPAID") {
            return res.status(400).json({
                success: false,
                message: "Paid or partially paid invoice cannot be cancelled",
            });
        }
        const invoice = await InvoiceModel.cancel(id);
        return res.status(200).json({
            success: true,
            message: "Invoice cancelled successfully",
            data: invoice,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
export const redeemLoyaltyPoints = async (req, res) => {
    try {
        const id = getInvoiceIdParam(req);
        const points = Number(req.body.points);
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Invoice ID is required",
            });
        }
        if (!Number.isInteger(points) ||
            points <= 0 ||
            typeof req.body.points === "boolean" ||
            req.body.points === null ||
            req.body.points === "") {
            return res.status(400).json({
                success: false,
                message: "Points must be a positive integer",
            });
        }
        if (!req.user?.userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }
        const data = await redeemInvoiceLoyalty({
            invoiceId: id,
            ...(req.user.role === "SUPER_ADMIN"
                ? {}
                : { salonId: req.user.salonId || "__missing__" }),
            points,
            createdById: req.user.userId,
        });
        return res.status(200).json({
            success: true,
            message: "Loyalty points redeemed successfully",
            data,
        });
    }
    catch (error) {
        if (error instanceof InvoiceRetentionError) {
            return res.status(error.status).json({
                success: false,
                message: error.message,
            });
        }
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
