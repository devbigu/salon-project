import { type Request, type Response } from "express";
import { z } from "zod";
import { requestAuditContext } from "../audit-logs/audit-log.service.js";
import {
  createPublicAppointment,
  findAvailableSlots,
  getEnabledSetting,
  listPublicBranches,
  listPublicServicesAndStaff,
  PublicBookingError,
} from "./public-booking.service.js";

const slugParam = (req: Request) =>
  typeof req.params.slug === "string" ? req.params.slug.toLowerCase() : "";

const uuid = z.string().uuid();
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD");
const serviceIds = z
  .string()
  .transform((value) => value.split(",").map((id) => id.trim()).filter(Boolean))
  .pipe(z.array(uuid).min(1).max(20));
const phone = z
  .string()
  .trim()
  .min(7)
  .max(24)
  .refine((value) => /^\+?[\d\s()-]+$/.test(value), "Invalid phone number")
  .refine(
    (value) => {
      const length = value.replace(/\D/g, "").length;
      return length >= 7 && length <= 15;
    },
    "Phone number must contain 7 to 15 digits"
  );

const slotsQuerySchema = z.object({
  branchId: uuid,
  serviceIds,
  staffId: uuid.optional(),
  date,
});

const appointmentSchema = z.object({
  branchId: uuid,
  customerName: z.string().trim().min(2).max(120),
  customerPhone: phone,
  customerEmail: z.string().trim().email().max(254).optional(),
  serviceIds: z.array(uuid).min(1).max(20),
  staffId: uuid.optional(),
  startTime: z.iso.datetime({ offset: true }),
  note: z.string().trim().max(1000).optional(),
});

const sendError = (res: Response, error: unknown) => {
  if (error instanceof PublicBookingError) {
    return res.status(error.status).json({ success: false, message: error.message });
  }
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      success: false,
      message: "Invalid booking request",
      errors: error.issues,
    });
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2034"
  ) {
    return res.status(409).json({
      success: false,
      message: "The slot changed while booking. Please choose it again.",
    });
  }
  console.error(error);
  return res.status(500).json({
    success: false,
    message: "Unable to process online booking",
  });
};

export const getPublicConfig = async (req: Request, res: Response) => {
  try {
    const setting = await getEnabledSetting(slugParam(req));
    return res.status(200).json({
      success: true,
      data: {
        slug: setting.slug,
        salon: {
          id: setting.salon.id,
          name: setting.salon.name,
          timezone: setting.salon.timezone,
        },
        branch: setting.branch
          ? { id: setting.branch.id, name: setting.branch.name }
          : null,
        allowStaffSelection: setting.allowStaffSelection,
        requireApproval: setting.requireApproval,
        bookingWindowDays: setting.bookingWindowDays,
        minNoticeMinutes: setting.minNoticeMinutes,
        slotIntervalMinutes: setting.slotIntervalMinutes,
        cancellationPolicyText: setting.cancellationPolicyText,
        termsText: setting.termsText,
        themeColor: setting.themeColor,
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
};

export const getPublicBranches = async (req: Request, res: Response) => {
  try {
    const data = await listPublicBranches(slugParam(req));
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return sendError(res, error);
  }
};

export const getPublicServices = async (req: Request, res: Response) => {
  try {
    const parsed = z.object({ branchId: uuid }).parse(req.query);
    const result = await listPublicServicesAndStaff(
      slugParam(req),
      parsed.branchId
    );
    return res.status(200).json({
      success: true,
      data: result.services,
      staff: result.staff,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

export const getAvailableSlots = async (req: Request, res: Response) => {
  try {
    const parsed = slotsQuerySchema.parse(req.query);
    const data = await findAvailableSlots({
      slug: slugParam(req),
      branchId: parsed.branchId,
      serviceIds: parsed.serviceIds,
      date: parsed.date,
      ...(parsed.staffId ? { staffId: parsed.staffId } : {}),
    });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return sendError(res, error);
  }
};

export const postPublicAppointment = async (req: Request, res: Response) => {
  try {
    const parsed = appointmentSchema.parse(req.body);
    const result = await createPublicAppointment(
      slugParam(req),
      {
        branchId: parsed.branchId,
        customerName: parsed.customerName,
        customerPhone: parsed.customerPhone,
        serviceIds: parsed.serviceIds,
        ...(parsed.customerEmail ? { customerEmail: parsed.customerEmail } : {}),
        ...(parsed.staffId ? { staffId: parsed.staffId } : {}),
        ...(parsed.note ? { note: parsed.note } : {}),
        startTime: new Date(parsed.startTime),
      },
      requestAuditContext(req)
    );
    return res.status(result.duplicate ? 200 : 201).json({
      success: true,
      message: result.duplicate
        ? "This booking was already received"
        : "Appointment booked successfully",
      duplicate: result.duplicate,
      data: {
        id: result.appointment.id,
        appointmentCode: result.appointment.appointmentCode,
        status: result.appointment.status,
        startTime: result.appointment.startTime,
        endTime: result.appointment.endTime,
        staffId: result.appointment.staffId,
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
};
