export const validateGenerationInput = (body: Record<string, unknown>) => {
  const month = Number(body.month);
  const year = Number(body.year);
  if (!body.staffId || typeof body.staffId !== "string") return "staffId is required";
  if (!Number.isInteger(month) || month < 1 || month > 12) return "month must be between 1 and 12";
  if (!Number.isInteger(year) || year < 2000 || year > 2200) return "year is invalid";
  for (const field of ["bonusAmount", "manualDeduction"] as const) {
    const value = Number(body[field] ?? 0);
    if (!Number.isFinite(value) || value < 0) return `${field} must be non-negative`;
  }
  return null;
};
