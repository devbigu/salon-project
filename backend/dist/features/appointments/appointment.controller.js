import {} from "express";
import { randomUUID } from "node:crypto";
import { AppointmentModel } from "./appointment.model.js";
import { CustomerModel } from "../customers/customer.model.js";
import { StaffModel } from "../staff/staff.model.js";
import { BranchModel } from "../branches/branch.model.js";
import { ServiceModel } from "../services/service.model.js";
const APPOINTMENT_STATUSES = [
    "SCHEDULED",
    "CONFIRMED",
    "CHECKED_IN",
    "COMPLETED",
    "CANCELLED",
    "NO_SHOW",
];
const isValidAppointmentStatus = (status) => {
    return APPOINTMENT_STATUSES.includes(status);
};
const getFinalSalonId = (req, bodySalonId) => {
    if (req.user?.role === "SUPER_ADMIN") {
        return bodySalonId;
    }
    return req.user?.salonId;
};
const getAppointmentIdParam = (req) => {
    const { id } = req.params;
    return typeof id === "string" ? id : null;
};
const generateAppointmentCode = () => {
    return `APT${Date.now()}${randomUUID().slice(0, 8)}`;
};
const durationToMinutes = (durationValue, durationUnit) => {
    if (!durationValue) {
        return 0;
    }
    if (durationUnit === "HOURS") {
        return durationValue * 60;
    }
    return durationValue;
};
const getDateRange = (date) => {
    if (!date) {
        return {};
    }
    const dateFrom = new Date(`${date}T00:00:00.000Z`);
    const dateTo = new Date(`${date}T23:59:59.999Z`);
    return {
        dateFrom,
        dateTo,
    };
};
const getExistingAppointmentByAccess = async (req, appointmentId) => {
    if (req.user?.role === "SUPER_ADMIN") {
        return AppointmentModel.findById(appointmentId);
    }
    const salonId = req.user?.salonId;
    if (!salonId) {
        return null;
    }
    return AppointmentModel.findByIdAndSalon(appointmentId, salonId);
};
export const createAppointment = async (req, res) => {
    try {
        const { salonId, branchId, customerId, staffId, serviceIds, startTime, status, bookingNote, internalNote, } = req.body;
        if (!customerId || !staffId || !startTime || !serviceIds?.length) {
            return res.status(400).json({
                success: false,
                message: "customerId, staffId, startTime and serviceIds are required",
            });
        }
        if (status && !isValidAppointmentStatus(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid appointment status",
            });
        }
        const finalSalonId = getFinalSalonId(req, salonId);
        if (!finalSalonId) {
            return res.status(400).json({
                success: false,
                message: "Salon ID is required",
            });
        }
        const customer = await CustomerModel.findByIdAndSalon(customerId, finalSalonId);
        if (!customer) {
            return res.status(400).json({
                success: false,
                message: "Invalid customer for this salon",
            });
        }
        const staff = await StaffModel.findByIdAndSalon(staffId, finalSalonId);
        if (!staff) {
            return res.status(400).json({
                success: false,
                message: "Invalid staff for this salon",
            });
        }
        if (branchId) {
            const branch = await BranchModel.findByIdAndSalon(branchId, finalSalonId);
            if (!branch) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid branch for this salon",
                });
            }
        }
        const services = await ServiceModel.findManyByIdsAndSalon(serviceIds, finalSalonId);
        if (services.length !== serviceIds.length) {
            return res.status(400).json({
                success: false,
                message: "One or more services are invalid for this salon",
            });
        }
        const totalDurationMinutes = services.reduce((total, service) => {
            return (total +
                durationToMinutes(service.durationValue, service.durationUnit));
        }, 0);
        const estimatedAmount = services.reduce((total, service) => {
            return total + Number(service.price);
        }, 0);
        const finalStartTime = new Date(startTime);
        if (Number.isNaN(finalStartTime.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Invalid startTime",
            });
        }
        const finalEndTime = new Date(finalStartTime.getTime() + totalDurationMinutes * 60 * 1000);
        const conflict = await AppointmentModel.findConflict({
            staffId,
            startTime: finalStartTime,
            endTime: finalEndTime,
        });
        if (conflict) {
            return res.status(409).json({
                success: false,
                message: "Staff is already booked for this time slot",
            });
        }
        const appointment = await AppointmentModel.create({
            appointmentCode: generateAppointmentCode(),
            salonId: finalSalonId,
            ...(branchId ? { branchId } : {}),
            customerId,
            staffId,
            startTime: finalStartTime,
            endTime: finalEndTime,
            totalDurationMinutes,
            estimatedAmount,
            ...(status ? { status } : {}),
            ...(bookingNote ? { bookingNote } : {}),
            ...(internalNote ? { internalNote } : {}),
            services: services.map((service) => ({
                serviceId: service.id,
                serviceName: service.name,
                price: Number(service.price),
                ...(service.durationValue !== null && service.durationValue !== undefined
                    ? { durationValue: service.durationValue }
                    : {}),
                ...(service.durationUnit
                    ? { durationUnit: service.durationUnit }
                    : {}),
            })),
        });
        return res.status(201).json({
            success: true,
            message: "Appointment created successfully",
            data: appointment,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
export const getAppointments = async (req, res) => {
    try {
        const { branchId, staffId, customerId, status, date } = req.query;
        if (status && !isValidAppointmentStatus(String(status))) {
            return res.status(400).json({
                success: false,
                message: "Invalid appointment status",
            });
        }
        if (req.user?.role === "SUPER_ADMIN") {
            const appointments = await AppointmentModel.findAll();
            return res.status(200).json({
                success: true,
                message: "Appointments fetched successfully",
                data: appointments,
            });
        }
        if (!req.user?.salonId) {
            return res.status(400).json({
                success: false,
                message: "Salon ID is missing",
            });
        }
        const appointments = await AppointmentModel.findBySalon(req.user.salonId, {
            ...(branchId ? { branchId: String(branchId) } : {}),
            ...(staffId ? { staffId: String(staffId) } : {}),
            ...(customerId ? { customerId: String(customerId) } : {}),
            ...(status ? { status: String(status) } : {}),
            ...getDateRange(date ? String(date) : undefined),
        });
        return res.status(200).json({
            success: true,
            message: "Appointments fetched successfully",
            data: appointments,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
export const getAppointmentById = async (req, res) => {
    try {
        const id = getAppointmentIdParam(req);
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Appointment ID is required",
            });
        }
        const appointment = await getExistingAppointmentByAccess(req, id);
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found",
            });
        }
        return res.status(200).json({
            success: true,
            message: "Appointment fetched successfully",
            data: appointment,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
export const updateAppointmentStatus = async (req, res) => {
    try {
        const id = getAppointmentIdParam(req);
        const { status, note } = req.body;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Appointment ID is required",
            });
        }
        if (!status || !isValidAppointmentStatus(status)) {
            return res.status(400).json({
                success: false,
                message: "Valid status is required",
            });
        }
        const existingAppointment = await getExistingAppointmentByAccess(req, id);
        if (!existingAppointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found",
            });
        }
        if (existingAppointment.status === status) {
            return res.status(400).json({
                success: false,
                message: "Appointment already has this status",
            });
        }
        const appointment = await AppointmentModel.updateStatusWithHistory(id, {
            oldStatus: existingAppointment.status,
            newStatus: status,
            ...(note ? { note } : {}),
            ...(req.user?.userId ? { changedById: req.user.userId } : {}),
        });
        return res.status(200).json({
            success: true,
            message: "Appointment status updated successfully",
            data: appointment,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
export const updateAppointmentBasicDetails = async (req, res) => {
    try {
        const id = getAppointmentIdParam(req);
        const { bookingNote, internalNote, status } = req.body;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Appointment ID is required",
            });
        }
        if (status && !isValidAppointmentStatus(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid appointment status",
            });
        }
        const existingAppointment = await getExistingAppointmentByAccess(req, id);
        if (!existingAppointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found",
            });
        }
        const updatedAppointment = await AppointmentModel.updateBasicDetails(id, {
            ...("bookingNote" in req.body
                ? { bookingNote: bookingNote ?? null }
                : {}),
            ...("internalNote" in req.body
                ? { internalNote: internalNote ?? null }
                : {}),
            ...(status ? { status } : {}),
        });
        return res.status(200).json({
            success: true,
            message: "Appointment updated successfully",
            data: updatedAppointment,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
export const rescheduleAppointment = async (req, res) => {
    try {
        const id = getAppointmentIdParam(req);
        const { startTime } = req.body;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Appointment ID is required",
            });
        }
        if (!startTime) {
            return res.status(400).json({
                success: false,
                message: "New startTime is required",
            });
        }
        const existingAppointment = await getExistingAppointmentByAccess(req, id);
        if (!existingAppointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found",
            });
        }
        if (existingAppointment.status === "COMPLETED" ||
            existingAppointment.status === "CANCELLED" ||
            existingAppointment.status === "NO_SHOW") {
            return res.status(400).json({
                success: false,
                message: "Completed, cancelled or no-show appointments cannot be rescheduled",
            });
        }
        const finalStartTime = new Date(startTime);
        if (Number.isNaN(finalStartTime.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Invalid startTime",
            });
        }
        if (existingAppointment.totalDurationMinutes <= 0) {
            return res.status(400).json({
                success: false,
                message: "Appointment duration is invalid",
            });
        }
        const finalEndTime = new Date(finalStartTime.getTime() +
            existingAppointment.totalDurationMinutes * 60 * 1000);
        const conflict = await AppointmentModel.findConflict({
            staffId: existingAppointment.staffId,
            startTime: finalStartTime,
            endTime: finalEndTime,
            excludeAppointmentId: id,
        });
        if (conflict) {
            return res.status(409).json({
                success: false,
                message: "Staff is already booked for this time slot",
            });
        }
        const updatedAppointment = await AppointmentModel.updateSchedule(id, {
            startTime: finalStartTime,
            endTime: finalEndTime,
        });
        return res.status(200).json({
            success: true,
            message: "Appointment rescheduled successfully",
            data: updatedAppointment,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
export const deleteAppointment = async (req, res) => {
    try {
        const id = getAppointmentIdParam(req);
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Appointment ID is required",
            });
        }
        const existingAppointment = await getExistingAppointmentByAccess(req, id);
        if (!existingAppointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found",
            });
        }
        await AppointmentModel.delete(id);
        return res.status(200).json({
            success: true,
            message: "Appointment deleted successfully",
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error. Appointment may already be linked with invoice.",
        });
    }
};
export const getAppointmentTracking = async (req, res) => {
    try {
        const id = getAppointmentIdParam(req);
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Appointment ID is required",
            });
        }
        const existingAppointment = await getExistingAppointmentByAccess(req, id);
        if (!existingAppointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found",
            });
        }
        const tracking = await AppointmentModel.findStatusHistory(id);
        return res.status(200).json({
            success: true,
            message: "Appointment tracking fetched successfully",
            data: tracking,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
