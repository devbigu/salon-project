import { z } from "zod";

const optionalText = z
  .union([z.string().trim(), z.null()])
  .optional()
  .transform((value) => (value === "" ? null : value));

const couponFields = {
  salonId: z.string().uuid().optional(),
  branchId: z.union([z.string().uuid(), z.null()]).optional(),
  couponCode: z
    .string()
    .trim()
    .min(1, "Coupon code is required")
    .max(50)
    .transform((value) => value.toUpperCase()),
  name: optionalText,
  description: optionalText,
  discountPercentage: z.coerce
    .number()
    .gt(0, "Discount percentage must be greater than 0")
    .lte(100, "Discount percentage must not exceed 100"),
  validFrom: z.coerce.date(),
  validUntil: z.coerce.date(),
  isActive: z.boolean().optional(),
  maxUsageCount: z.coerce.number().int().positive().nullable().optional(),
  minInvoiceAmount: z.coerce.number().min(0).nullable().optional(),
};

export const createCouponSchema = z
  .object(couponFields)
  .refine((value) => value.validUntil > value.validFrom, {
    message: "validUntil must be after validFrom",
    path: ["validUntil"],
  });

export const updateCouponSchema = z.object(couponFields).partial();

export const couponStatusSchema = z.object({
  isActive: z.boolean(),
});

export const applyCouponSchema = z.object({
  couponCode: z
    .string()
    .trim()
    .min(1, "Coupon code is required")
    .max(50)
    .transform((value) => value.toUpperCase()),
});

export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
