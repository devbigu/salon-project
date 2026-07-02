import { type Request, type Response } from "express";
import type { LatePenaltyType, SalaryType } from "../../generated/prisma/enums.js";
import { SalaryConfigModel, type SalaryConfigData } from "./salaryConfig.model.js";
import { validateSalaryConfigInput } from "./salaryConfig.validation.js";

const text = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;
const idParam = (req: Request, key = "id") => text(req.params[key]);
const branchRole = (role?: string) => role === "BRANCH_MANAGER";

const scopedStaff = async (req: Request, requestedId?: string) => {
  if (!req.user) return { error: [401, "Unauthorized"] as const };
  const staff =
    req.user.role === "STAFF"
      ? await SalaryConfigModel.findStaffByUser(req.user.userId)
      : requestedId
        ? await SalaryConfigModel.findStaff(requestedId)
        : null;
  if (!staff) return { error: [404, "Staff not found"] as const };
  if (req.user.role === "STAFF" && requestedId && requestedId !== staff.id) {
    return { error: [403, "Staff can only view their own salary configuration"] as const };
  }
  if (req.user.role !== "SUPER_ADMIN") {
    if (!req.user.salonId || staff.salonId !== req.user.salonId) {
      return { error: [403, "Staff does not belong to your salon"] as const };
    }
    if (branchRole(req.user.role) && req.user.branchId && staff.branchId !== req.user.branchId) {
      return { error: [403, "Staff does not belong to your branch"] as const };
    }
  }
  return { staff };
};

const configAccess = async (req: Request, id: string) => {
  const config = await SalaryConfigModel.findById(id);
  if (!config) return { error: [404, "Salary configuration not found"] as const };
  if (req.user?.role !== "SUPER_ADMIN") {
    if (!req.user?.salonId || config.salonId !== req.user.salonId) {
      return { error: [403, "You do not have access to this salary configuration"] as const };
    }
    if (req.user.role === "STAFF") {
      const own = await SalaryConfigModel.findStaffByUser(req.user.userId);
      if (!own || own.id !== config.staffId) {
        return { error: [403, "Staff can only view their own salary configuration"] as const };
      }
    }
    if (branchRole(req.user.role) && req.user.branchId !== config.branchId) {
      return { error: [403, "You do not have access to this branch"] as const };
    }
  }
  return { config };
};

const inputData = (body: Record<string, unknown>) => ({
  ...(body.baseSalary !== undefined ? { baseSalary: Number(body.baseSalary) } : {}),
  ...(body.workingDaysPerMonth !== undefined
    ? { workingDaysPerMonth: Number(body.workingDaysPerMonth) }
    : {}),
  ...(body.salaryType !== undefined ? { salaryType: body.salaryType as SalaryType } : {}),
  ...(body.paidLeavesAllowed !== undefined ? { paidLeavesAllowed: Number(body.paidLeavesAllowed) } : {}),
  ...(body.lateGraceMinutes !== undefined ? { lateGraceMinutes: Number(body.lateGraceMinutes) } : {}),
  ...(body.latePenaltyType !== undefined
    ? { latePenaltyType: body.latePenaltyType as LatePenaltyType }
    : {}),
  ...(body.latePenaltyAmount !== undefined ? { latePenaltyAmount: Number(body.latePenaltyAmount) } : {}),
  ...(body.serviceCommissionPercentage !== undefined
    ? { serviceCommissionPercentage: Number(body.serviceCommissionPercentage) }
    : {}),
  ...(body.serviceMinimumWorkThreshold !== undefined
    ? { serviceMinimumWorkThreshold: Number(body.serviceMinimumWorkThreshold) }
    : {}),
  ...(body.retailCommissionPercentage !== undefined
    ? { retailCommissionPercentage: Number(body.retailCommissionPercentage) }
    : {}),
  ...(body.retailMinimumSalesThreshold !== undefined
    ? { retailMinimumSalesThreshold: Number(body.retailMinimumSalesThreshold) }
    : {}),
  ...(typeof body.status === "boolean" ? { status: body.status } : {}),
  ...(body.effectiveFrom !== undefined ? { effectiveFrom: new Date(String(body.effectiveFrom)) } : {}),
  ...(body.effectiveTo === null
    ? { effectiveTo: null }
    : body.effectiveTo !== undefined
      ? { effectiveTo: new Date(String(body.effectiveTo)) }
      : {}),
});

export const createSalaryConfig = async (req: Request, res: Response) => {
  try {
    const staffId = idParam(req, "staffId");
    if (!staffId) return res.status(400).json({ success: false, message: "staffId is required" });
    const error = validateSalaryConfigInput(req.body);
    if (error) return res.status(400).json({ success: false, message: error });
    if (req.body.baseSalary === undefined || req.body.workingDaysPerMonth === undefined || !req.body.effectiveFrom) {
      return res.status(400).json({ success: false, message: "baseSalary, workingDaysPerMonth and effectiveFrom are required" });
    }
    const access = await scopedStaff(req, staffId);
    if ("error" in access) return res.status(access.error[0]).json({ success: false, message: access.error[1] });
    if (req.user?.role === "SUPER_ADMIN" && text(req.body.salonId) && req.body.salonId !== access.staff.salonId) {
      return res.status(403).json({ success: false, message: "Staff does not belong to the selected salon" });
    }
    const branchId = text(req.body.branchId) ?? access.staff.branchId ?? undefined;
    if (branchId) {
      const branch = await SalaryConfigModel.findBranch(branchId);
      if (!branch || branch.salonId !== access.staff.salonId || (access.staff.branchId && access.staff.branchId !== branchId)) {
        return res.status(400).json({ success: false, message: "Invalid branch for this staff" });
      }
    }
    const values = inputData(req.body);
    const data: SalaryConfigData = {
      salonId: access.staff.salonId,
      staffId: access.staff.id,
      baseSalary: values.baseSalary!,
      workingDaysPerMonth: values.workingDaysPerMonth!,
      effectiveFrom: values.effectiveFrom!,
      ...(branchId ? { branchId } : {}),
      ...values,
    };
    const config = await SalaryConfigModel.create(data);
    return res.status(201).json({ success: true, data: config });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getStaffSalaryConfig = async (req: Request, res: Response) => {
  const staffId = idParam(req, "staffId");
  if (!staffId) return res.status(400).json({ success: false, message: "staffId is required" });
  const access = await scopedStaff(req, staffId);
  if ("error" in access) return res.status(access.error[0]).json({ success: false, message: access.error[1] });
  const config = await SalaryConfigModel.findActiveForStaff(access.staff.id);
  if (!config) return res.status(404).json({ success: false, message: "Active salary configuration not found" });
  return res.json({ success: true, data: config });
};

export const getSalaryConfig = async (req: Request, res: Response) => {
  const id = idParam(req);
  if (!id) return res.status(400).json({ success: false, message: "Configuration ID is required" });
  const access = await configAccess(req, id);
  if ("error" in access) return res.status(access.error[0]).json({ success: false, message: access.error[1] });
  return res.json({ success: true, data: access.config });
};

export const updateSalaryConfig = async (req: Request, res: Response) => {
  try {
    const id = idParam(req);
    if (!id) return res.status(400).json({ success: false, message: "Configuration ID is required" });
    const error = validateSalaryConfigInput(req.body);
    if (error) return res.status(400).json({ success: false, message: error });
    const access = await configAccess(req, id);
    if ("error" in access) return res.status(access.error[0]).json({ success: false, message: access.error[1] });
    const config = await SalaryConfigModel.update(id, inputData(req.body));
    return res.json({ success: true, data: config });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const setSalaryConfigStatus = async (req: Request, res: Response) => {
  const id = idParam(req);
  if (!id || typeof req.body.status !== "boolean") {
    return res.status(400).json({ success: false, message: "Configuration ID and boolean status are required" });
  }
  const access = await configAccess(req, id);
  if ("error" in access) return res.status(access.error[0]).json({ success: false, message: access.error[1] });
  const config = await SalaryConfigModel.setStatus(id, access.config.salonId, access.config.staffId, req.body.status);
  return res.json({ success: true, data: config });
};
