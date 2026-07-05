import { Prisma } from "../../generated/prisma/client.js";
import { createStockMovement } from "./stockMovement.service.js";

type TransactionClient = Prisma.TransactionClient;

export const reverseAppointmentConsumables = async (input: {
  tx: TransactionClient;
  appointmentId: string;
  salonId: string;
  branchId?: string | null | undefined;
  createdById?: string | undefined;
}) => {
  await input.tx.$queryRaw`
    SELECT "id"
    FROM "Appointment"
    WHERE "id" = ${input.appointmentId}
      AND "salonId" = ${input.salonId}
    FOR UPDATE
  `;

  const deductions = await input.tx.productStockMovement.findMany({
    where: {
      salonId: input.salonId,
      type: "USED_IN_SERVICE",
      referenceType: "APPOINTMENT",
      referenceId: input.appointmentId,
    },
    orderBy: [{ productId: "asc" }, { createdAt: "asc" }],
  });

  const deductionsByProduct = new Map<
    string,
    {
      branchId: string | null;
      quantity: Prisma.Decimal;
      movementIds: string[];
    }
  >();
  for (const deduction of deductions) {
    const existing = deductionsByProduct.get(deduction.productId);
    if (existing) {
      existing.quantity = existing.quantity.add(deduction.quantity);
      existing.movementIds.push(deduction.id);
    } else {
      deductionsByProduct.set(deduction.productId, {
        branchId: deduction.branchId,
        quantity: deduction.quantity,
        movementIds: [deduction.id],
      });
    }
  }

  let reversed = 0;
  let duplicates = 0;
  for (const [productId, deduction] of deductionsByProduct) {
    const branchId = input.branchId ?? deduction.branchId;
    const result = await createStockMovement({
      tx: input.tx,
      salonId: input.salonId,
      ...(branchId ? { branchId } : {}),
      productId,
      type: "RETURNED",
      quantity: deduction.quantity,
      referenceType: "APPOINTMENT_CONSUMABLE_REVERSAL",
      referenceId: input.appointmentId,
      reason: "Reversed consumables for cancelled completed appointment",
      note: `Reversal of service-consumable movement(s) ${deduction.movementIds.join(", ")}`,
      ...(input.createdById ? { createdById: input.createdById } : {}),
    });
    if (result.duplicate) {
      duplicates += 1;
    } else {
      reversed += 1;
    }
  }

  return {
    deductions: deductions.length,
    reversed,
    duplicates,
  };
};
