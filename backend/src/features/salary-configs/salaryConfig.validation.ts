import type { LatePenaltyType, SalaryType } from "../../generated/prisma/enums.js";

export const SALARY_TYPES = ["MONTHLY", "DAILY"] as const satisfies readonly SalaryType[];
export const LATE_PENALTY_TYPES = [
  "NONE",
  "FIXED_PER_LATE_DAY",
  "PER_LATE_MINUTE",
] as const satisfies readonly LatePenaltyType[];

export const validateSalaryConfigInput = (body: Record<string, unknown>) => {
  const nonNegativeFields = [
    "baseSalary",
    "paidLeavesAllowed",
    "lateGraceMinutes",
    "latePenaltyAmount",
    "serviceCommissionPercentage",
    "serviceMinimumWorkThreshold",
    "retailCommissionPercentage",
    "retailMinimumSalesThreshold",
  ] as const;

  for (const field of nonNegativeFields) {
    if (body[field] !== undefined) {
      const value = Number(body[field]);
      if (!Number.isFinite(value) || value < 0) {
        return `${field} must be a non-negative number`;
      }
    }
  }

  if (
    body.workingDaysPerMonth !== undefined &&
    (!Number.isInteger(Number(body.workingDaysPerMonth)) ||
      Number(body.workingDaysPerMonth) <= 0)
  ) {
    return "workingDaysPerMonth must be a positive integer";
  }

  if (
    body.salaryType !== undefined &&
    !SALARY_TYPES.includes(body.salaryType as SalaryType)
  ) {
    return "Invalid salaryType";
  }

  if (
    body.latePenaltyType !== undefined &&
    !LATE_PENALTY_TYPES.includes(body.latePenaltyType as LatePenaltyType)
  ) {
    return "Invalid latePenaltyType";
  }

  if (body.effectiveFrom !== undefined) {
    const date = new Date(String(body.effectiveFrom));
    if (Number.isNaN(date.getTime())) return "Invalid effectiveFrom";
  }

  if (body.effectiveTo !== undefined && body.effectiveTo !== null) {
    const date = new Date(String(body.effectiveTo));
    if (Number.isNaN(date.getTime())) return "Invalid effectiveTo";
  }

  return null;
};
