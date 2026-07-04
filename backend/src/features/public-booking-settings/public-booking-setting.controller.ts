import { type Request, type Response } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { Prisma } from "../../generated/prisma/client.js";
import {
  createAuditLog,
  requestAuditContext,
} from "../audit-logs/audit-log.service.js";

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens");

const fieldsSchema = z.object({
  slug: slugSchema.optional(),
  isEnabled: z.boolean().optional(),
  allowStaffSelection: z.boolean().optional(),
  requireCustomerOtp: z.literal(false).optional(),
  requireApproval: z.boolean().optional(),
  bookingWindowDays: z.number().int().min(1).max(365).optional(),
  minNoticeMinutes: z.number().int().min(0).max(43_200).optional(),
  slotIntervalMinutes: z.number().int().min(5).max(120).optional(),
  cancellationPolicyText: z.string().trim().max(5000).nullable().optional(),
  termsText: z.string().trim().max(10_000).nullable().optional(),
  themeColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Theme color must be a six-digit hex color")
    .nullable()
    .optional(),
});

const createSchema = fieldsSchema.extend({
  salonId: z.string().uuid().optional(),
  branchId: z.string().uuid().nullable().optional(),
  slug: slugSchema,
});

const idParam = (req: Request) =>
  typeof req.params.id === "string" ? req.params.id : "";

const settingInclude = {
  salon: { select: { id: true, name: true } },
  branch: { select: { id: true, name: true } },
} as const;

const accessWhere = (req: Request) => {
  if (req.user?.role === "SUPER_ADMIN") return {};
  if (!req.user?.salonId) return { id: "__none__" };
  return {
    salonId: req.user.salonId,
    ...(req.user.role === "BRANCH_MANAGER"
      ? { branchId: req.user.branchId ?? "__none__" }
      : req.user.role === "RECEPTIONIST" && req.user.branchId
        ? { OR: [{ branchId: null }, { branchId: req.user.branchId }] }
        : {}),
  };
};

const loadSetting = (req: Request, id: string) =>
  prisma.publicBookingSetting.findFirst({
    where: { id, ...accessWhere(req) },
    include: settingInclude,
  });

const resolveSalonAndBranch = async (
  req: Request,
  requestedSalonId: string | undefined,
  requestedBranchId: string | null | undefined
) => {
  const salonId =
    req.user?.role === "SUPER_ADMIN" ? requestedSalonId : req.user?.salonId;
  if (!salonId) throw new SettingError(400, "Salon ID is required");

  let branchId = requestedBranchId ?? null;
  if (req.user?.role === "BRANCH_MANAGER") {
    if (!req.user.branchId) throw new SettingError(403, "Branch access is required");
    if (branchId && branchId !== req.user.branchId) {
      throw new SettingError(403, "You cannot manage another branch");
    }
    branchId = req.user.branchId;
  }

  const salon = await prisma.salon.findUnique({
    where: { id: salonId },
    select: { id: true },
  });
  if (!salon) throw new SettingError(400, "Invalid salon");
  if (branchId) {
    const branch = await prisma.branch.findFirst({
      where: { id: branchId, salonId },
      select: { id: true },
    });
    if (!branch) throw new SettingError(400, "Branch does not belong to the salon");
  }
  return { salonId, branchId };
};

class SettingError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
  }
}

const sendError = (res: Response, error: unknown) => {
  if (error instanceof SettingError) {
    return res.status(error.status).json({ success: false, message: error.message });
  }
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      success: false,
      message: "Invalid online booking settings",
      errors: error.issues,
    });
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  ) {
    return res.status(409).json({
      success: false,
      message: "That slug or salon/branch setting already exists",
    });
  }
  console.error(error);
  return res.status(500).json({
    success: false,
    message: "Unable to save online booking settings",
  });
};

export const listPublicBookingSettings = async (req: Request, res: Response) => {
  try {
    const requestedSalonId =
      typeof req.query.salonId === "string" ? req.query.salonId : undefined;
    const where =
      req.user?.role === "SUPER_ADMIN"
        ? requestedSalonId
          ? { salonId: requestedSalonId }
          : {}
        : accessWhere(req);
    const data = await prisma.publicBookingSetting.findMany({
      where,
      include: settingInclude,
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return sendError(res, error);
  }
};

export const getPublicBookingSetting = async (req: Request, res: Response) => {
  try {
    const data = await loadSetting(req, idParam(req));
    if (!data) {
      return res.status(404).json({ success: false, message: "Setting not found" });
    }
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return sendError(res, error);
  }
};

export const createPublicBookingSetting = async (req: Request, res: Response) => {
  try {
    const parsed = createSchema.parse(req.body);
    const scope = await resolveSalonAndBranch(
      req,
      parsed.salonId,
      parsed.branchId
    );
    const data = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`
        SELECT pg_advisory_xact_lock(
          hashtext(${`public-setting:${scope.salonId}:${scope.branchId ?? "salon"}`})
        ) IS NULL AS "locked"
      `;
      const existing = await tx.publicBookingSetting.findFirst({
        where: { salonId: scope.salonId, branchId: scope.branchId },
        select: { id: true },
      });
      if (existing) {
        throw new SettingError(409, "A setting already exists for this scope");
      }
      const created = await tx.publicBookingSetting.create({
        data: {
          salonId: scope.salonId,
          branchId: scope.branchId,
          slug: parsed.slug,
          ...(parsed.isEnabled !== undefined ? { isEnabled: parsed.isEnabled } : {}),
          ...(parsed.allowStaffSelection !== undefined
            ? { allowStaffSelection: parsed.allowStaffSelection }
            : {}),
          ...(parsed.requireApproval !== undefined
            ? { requireApproval: parsed.requireApproval }
            : {}),
          ...(parsed.bookingWindowDays !== undefined
            ? { bookingWindowDays: parsed.bookingWindowDays }
            : {}),
          ...(parsed.minNoticeMinutes !== undefined
            ? { minNoticeMinutes: parsed.minNoticeMinutes }
            : {}),
          ...(parsed.slotIntervalMinutes !== undefined
            ? { slotIntervalMinutes: parsed.slotIntervalMinutes }
            : {}),
          ...(parsed.cancellationPolicyText !== undefined
            ? { cancellationPolicyText: parsed.cancellationPolicyText }
            : {}),
          ...(parsed.termsText !== undefined ? { termsText: parsed.termsText } : {}),
          ...(parsed.themeColor !== undefined
            ? { themeColor: parsed.themeColor }
            : {}),
        },
        include: settingInclude,
      });
      await createAuditLog({
        tx,
        salonId: created.salonId,
        branchId: created.branchId,
        userId: req.user?.userId,
        module: "PUBLIC_BOOKING",
        action: "CREATE",
        entityId: created.id,
        entityCode: created.slug,
        entityName: created.slug,
        description: `Public booking setting ${created.slug} created`,
        newData: created,
        ...requestAuditContext(req),
      });
      return created;
    });
    return res.status(201).json({
      success: true,
      message: "Online booking setting created",
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

export const updatePublicBookingSetting = async (req: Request, res: Response) => {
  try {
    const existing = await loadSetting(req, idParam(req));
    if (!existing) {
      return res.status(404).json({ success: false, message: "Setting not found" });
    }
    const parsed = fieldsSchema
      .extend({ branchId: z.string().uuid().nullable().optional() })
      .parse(req.body);
    const nextBranchId =
      parsed.branchId === undefined ? existing.branchId : parsed.branchId;
    await resolveSalonAndBranch(req, existing.salonId, nextBranchId);

    const data = await prisma.$transaction(async (tx) => {
      const updateData: Prisma.PublicBookingSettingUncheckedUpdateInput = {
        ...(parsed.slug !== undefined ? { slug: parsed.slug } : {}),
        ...(parsed.isEnabled !== undefined
          ? { isEnabled: parsed.isEnabled }
          : {}),
        ...(parsed.allowStaffSelection !== undefined
          ? { allowStaffSelection: parsed.allowStaffSelection }
          : {}),
        ...(parsed.requireCustomerOtp !== undefined
          ? { requireCustomerOtp: parsed.requireCustomerOtp }
          : {}),
        ...(parsed.requireApproval !== undefined
          ? { requireApproval: parsed.requireApproval }
          : {}),
        ...(parsed.bookingWindowDays !== undefined
          ? { bookingWindowDays: parsed.bookingWindowDays }
          : {}),
        ...(parsed.minNoticeMinutes !== undefined
          ? { minNoticeMinutes: parsed.minNoticeMinutes }
          : {}),
        ...(parsed.slotIntervalMinutes !== undefined
          ? { slotIntervalMinutes: parsed.slotIntervalMinutes }
          : {}),
        ...(parsed.cancellationPolicyText !== undefined
          ? { cancellationPolicyText: parsed.cancellationPolicyText }
          : {}),
        ...(parsed.termsText !== undefined ? { termsText: parsed.termsText } : {}),
        ...(parsed.themeColor !== undefined
          ? { themeColor: parsed.themeColor }
          : {}),
        ...(parsed.branchId !== undefined ? { branchId: parsed.branchId } : {}),
      };
      const updated = await tx.publicBookingSetting.update({
        where: { id: existing.id },
        data: updateData,
        include: settingInclude,
      });
      await createAuditLog({
        tx,
        salonId: updated.salonId,
        branchId: updated.branchId,
        userId: req.user?.userId,
        module: "PUBLIC_BOOKING",
        action: "UPDATE",
        entityId: updated.id,
        entityCode: updated.slug,
        entityName: updated.slug,
        description: `Public booking setting ${updated.slug} updated`,
        oldData: existing,
        newData: updated,
        ...requestAuditContext(req),
      });
      return updated;
    });
    return res.status(200).json({
      success: true,
      message: "Online booking setting updated",
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

export const setPublicBookingSettingStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const parsed = z.object({ isEnabled: z.boolean() }).parse(req.body);
    const existing = await loadSetting(req, idParam(req));
    if (!existing) {
      return res.status(404).json({ success: false, message: "Setting not found" });
    }
    const data = await prisma.$transaction(async (tx) => {
      const updated = await tx.publicBookingSetting.update({
        where: { id: existing.id },
        data: parsed,
        include: settingInclude,
      });
      await createAuditLog({
        tx,
        salonId: updated.salonId,
        branchId: updated.branchId,
        userId: req.user?.userId,
        module: "PUBLIC_BOOKING",
        action: "STATUS_CHANGE",
        entityId: updated.id,
        entityCode: updated.slug,
        entityName: updated.slug,
        description: `Public booking ${updated.isEnabled ? "enabled" : "disabled"} for ${updated.slug}`,
        oldData: { isEnabled: existing.isEnabled },
        newData: { isEnabled: updated.isEnabled },
        ...requestAuditContext(req),
      });
      return updated;
    });
    return res.status(200).json({
      success: true,
      message: `Online booking ${data.isEnabled ? "enabled" : "disabled"}`,
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
};
