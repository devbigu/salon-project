-- Add business-facing codes without changing UUID primary keys.
ALTER TABLE "Salon" ADD COLUMN "salonCode" TEXT;
ALTER TABLE "Expense" ADD COLUMN "expenseCode" TEXT;

CREATE UNIQUE INDEX "Salon_salonCode_key" ON "Salon"("salonCode");
CREATE UNIQUE INDEX "Expense_salonId_expenseCode_key" ON "Expense"("salonId", "expenseCode");
