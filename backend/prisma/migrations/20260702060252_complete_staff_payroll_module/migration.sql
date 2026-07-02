-- CreateEnum
CREATE TYPE "SalaryType" AS ENUM ('MONTHLY', 'DAILY');

-- CreateEnum
CREATE TYPE "LatePenaltyType" AS ENUM ('NONE', 'FIXED_PER_LATE_DAY', 'PER_LATE_MINUTE');

-- CreateEnum
CREATE TYPE "SalarySlipStatus" AS ENUM ('DRAFT', 'GENERATED', 'PAID', 'CANCELLED');

-- AlterTable
ALTER TABLE "RetailSale" ADD COLUMN     "staffId" TEXT;

-- CreateTable
CREATE TABLE "StaffSalaryConfig" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "branchId" TEXT,
    "staffId" TEXT NOT NULL,
    "baseSalary" DECIMAL(10,2) NOT NULL,
    "salaryType" "SalaryType" NOT NULL DEFAULT 'MONTHLY',
    "workingDaysPerMonth" INTEGER NOT NULL,
    "paidLeavesAllowed" INTEGER NOT NULL DEFAULT 0,
    "lateGraceMinutes" INTEGER NOT NULL DEFAULT 10,
    "latePenaltyType" "LatePenaltyType" NOT NULL DEFAULT 'NONE',
    "latePenaltyAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "serviceCommissionPercentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "serviceMinimumWorkThreshold" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "retailCommissionPercentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "retailMinimumSalesThreshold" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffSalaryConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalarySlip" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "branchId" TEXT,
    "staffId" TEXT NOT NULL,
    "salaryConfigId" TEXT,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "baseSalary" DECIMAL(10,2) NOT NULL,
    "workingDays" INTEGER NOT NULL,
    "presentDays" INTEGER NOT NULL DEFAULT 0,
    "halfDays" INTEGER NOT NULL DEFAULT 0,
    "paidLeaveDays" INTEGER NOT NULL DEFAULT 0,
    "unpaidLeaveDays" INTEGER NOT NULL DEFAULT 0,
    "absentDays" INTEGER NOT NULL DEFAULT 0,
    "lateDays" INTEGER NOT NULL DEFAULT 0,
    "totalLateMinutes" INTEGER NOT NULL DEFAULT 0,
    "perDaySalary" DECIMAL(10,2) NOT NULL,
    "unpaidLeaveDeduction" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "latePenalty" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "manualDeduction" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "bonusAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "serviceRevenue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "serviceMinimumWorkThreshold" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "serviceCommissionPercentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "serviceCommissionAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "retailSalesRevenue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "retailMinimumSalesThreshold" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "retailCommissionPercentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "retailCommissionAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "grossSalary" DECIMAL(10,2) NOT NULL,
    "netSalary" DECIMAL(10,2) NOT NULL,
    "status" "SalarySlipStatus" NOT NULL DEFAULT 'GENERATED',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "paidById" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalarySlip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StaffSalaryConfig_salonId_staffId_status_idx" ON "StaffSalaryConfig"("salonId", "staffId", "status");

-- CreateIndex
CREATE INDEX "StaffSalaryConfig_branchId_idx" ON "StaffSalaryConfig"("branchId");

-- CreateIndex
CREATE INDEX "StaffSalaryConfig_staffId_effectiveFrom_effectiveTo_idx" ON "StaffSalaryConfig"("staffId", "effectiveFrom", "effectiveTo");

-- CreateIndex
CREATE INDEX "SalarySlip_salonId_month_year_idx" ON "SalarySlip"("salonId", "month", "year");

-- CreateIndex
CREATE INDEX "SalarySlip_staffId_month_year_idx" ON "SalarySlip"("staffId", "month", "year");

-- CreateIndex
CREATE INDEX "SalarySlip_branchId_month_year_idx" ON "SalarySlip"("branchId", "month", "year");

-- CreateIndex
CREATE INDEX "SalarySlip_paidById_idx" ON "SalarySlip"("paidById");

-- CreateIndex
CREATE UNIQUE INDEX "SalarySlip_salonId_staffId_month_year_key" ON "SalarySlip"("salonId", "staffId", "month", "year");

-- CreateIndex
CREATE INDEX "RetailSale_staffId_idx" ON "RetailSale"("staffId");

-- AddForeignKey
ALTER TABLE "StaffSalaryConfig" ADD CONSTRAINT "StaffSalaryConfig_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffSalaryConfig" ADD CONSTRAINT "StaffSalaryConfig_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffSalaryConfig" ADD CONSTRAINT "StaffSalaryConfig_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalarySlip" ADD CONSTRAINT "SalarySlip_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalarySlip" ADD CONSTRAINT "SalarySlip_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalarySlip" ADD CONSTRAINT "SalarySlip_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalarySlip" ADD CONSTRAINT "SalarySlip_salaryConfigId_fkey" FOREIGN KEY ("salaryConfigId") REFERENCES "StaffSalaryConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalarySlip" ADD CONSTRAINT "SalarySlip_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetailSale" ADD CONSTRAINT "RetailSale_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
