-- CreateEnum
CREATE TYPE "CustomerPackageUsageStatus" AS ENUM ('RESERVED', 'USED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "InvoiceItemType" ADD VALUE 'PACKAGE_REDEMPTION';

-- AlterTable
ALTER TABLE "AppointmentService" ADD COLUMN "customerPackageUsageItemId" TEXT;

-- AlterTable
ALTER TABLE "InvoiceItem" ADD COLUMN "customerPackageUsageItemId" TEXT;

-- CreateTable
CREATE TABLE "CustomerPackageServiceBalance" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "customerPackageId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "serviceNameSnapshot" TEXT NOT NULL,
    "includedQuantity" INTEGER NOT NULL,
    "usedQuantity" INTEGER NOT NULL DEFAULT 0,
    "reservedQuantity" INTEGER NOT NULL DEFAULT 0,
    "priceSnapshot" DECIMAL(10,2) NOT NULL,
    "durationMinutesSnapshot" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerPackageServiceBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerPackageUsage" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "customerPackageId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "invoiceId" TEXT,
    "jobCartAppointmentId" TEXT,
    "status" "CustomerPackageUsageStatus" NOT NULL DEFAULT 'RESERVED',
    "usedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerPackageUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerPackageUsageItem" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "usageId" TEXT NOT NULL,
    "customerPackageServiceBalanceId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "serviceNameSnapshot" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "priceSnapshot" DECIMAL(10,2) NOT NULL,
    "durationMinutesSnapshot" INTEGER,
    "staffId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerPackageUsageItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerPackageServiceBalance_salonId_idx" ON "CustomerPackageServiceBalance"("salonId");
CREATE INDEX "CustomerPackageServiceBalance_branchId_idx" ON "CustomerPackageServiceBalance"("branchId");
CREATE INDEX "CustomerPackageServiceBalance_customerId_idx" ON "CustomerPackageServiceBalance"("customerId");
CREATE INDEX "CustomerPackageServiceBalance_customerPackageId_idx" ON "CustomerPackageServiceBalance"("customerPackageId");
CREATE INDEX "CustomerPackageServiceBalance_serviceId_idx" ON "CustomerPackageServiceBalance"("serviceId");
CREATE UNIQUE INDEX "CustomerPackageServiceBalance_customerPackageId_serviceId_key" ON "CustomerPackageServiceBalance"("customerPackageId", "serviceId");

CREATE INDEX "CustomerPackageUsage_salonId_idx" ON "CustomerPackageUsage"("salonId");
CREATE INDEX "CustomerPackageUsage_branchId_idx" ON "CustomerPackageUsage"("branchId");
CREATE INDEX "CustomerPackageUsage_customerId_idx" ON "CustomerPackageUsage"("customerId");
CREATE INDEX "CustomerPackageUsage_customerPackageId_idx" ON "CustomerPackageUsage"("customerPackageId");
CREATE INDEX "CustomerPackageUsage_appointmentId_idx" ON "CustomerPackageUsage"("appointmentId");
CREATE INDEX "CustomerPackageUsage_invoiceId_idx" ON "CustomerPackageUsage"("invoiceId");
CREATE INDEX "CustomerPackageUsage_jobCartAppointmentId_idx" ON "CustomerPackageUsage"("jobCartAppointmentId");
CREATE INDEX "CustomerPackageUsage_status_idx" ON "CustomerPackageUsage"("status");

CREATE INDEX "CustomerPackageUsageItem_salonId_idx" ON "CustomerPackageUsageItem"("salonId");
CREATE INDEX "CustomerPackageUsageItem_usageId_idx" ON "CustomerPackageUsageItem"("usageId");
CREATE INDEX "CustomerPackageUsageItem_serviceId_idx" ON "CustomerPackageUsageItem"("serviceId");
CREATE INDEX "CustomerPackageUsageItem_staffId_idx" ON "CustomerPackageUsageItem"("staffId");

CREATE INDEX "AppointmentService_customerPackageUsageItemId_idx" ON "AppointmentService"("customerPackageUsageItemId");
CREATE UNIQUE INDEX "InvoiceItem_customerPackageUsageItemId_key" ON "InvoiceItem"("customerPackageUsageItemId");

-- AddForeignKey
ALTER TABLE "AppointmentService" ADD CONSTRAINT "AppointmentService_customerPackageUsageItemId_fkey" FOREIGN KEY ("customerPackageUsageItemId") REFERENCES "CustomerPackageUsageItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_customerPackageUsageItemId_fkey" FOREIGN KEY ("customerPackageUsageItemId") REFERENCES "CustomerPackageUsageItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CustomerPackageServiceBalance" ADD CONSTRAINT "CustomerPackageServiceBalance_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CustomerPackageServiceBalance" ADD CONSTRAINT "CustomerPackageServiceBalance_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CustomerPackageServiceBalance" ADD CONSTRAINT "CustomerPackageServiceBalance_customerPackageId_fkey" FOREIGN KEY ("customerPackageId") REFERENCES "CustomerPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomerPackageServiceBalance" ADD CONSTRAINT "CustomerPackageServiceBalance_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CustomerPackageServiceBalance" ADD CONSTRAINT "CustomerPackageServiceBalance_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "ServicePackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CustomerPackageServiceBalance" ADD CONSTRAINT "CustomerPackageServiceBalance_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CustomerPackageUsage" ADD CONSTRAINT "CustomerPackageUsage_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CustomerPackageUsage" ADD CONSTRAINT "CustomerPackageUsage_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CustomerPackageUsage" ADD CONSTRAINT "CustomerPackageUsage_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CustomerPackageUsage" ADD CONSTRAINT "CustomerPackageUsage_customerPackageId_fkey" FOREIGN KEY ("customerPackageId") REFERENCES "CustomerPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CustomerPackageUsage" ADD CONSTRAINT "CustomerPackageUsage_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CustomerPackageUsage" ADD CONSTRAINT "CustomerPackageUsage_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CustomerPackageUsage" ADD CONSTRAINT "CustomerPackageUsage_jobCartAppointmentId_fkey" FOREIGN KEY ("jobCartAppointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CustomerPackageUsage" ADD CONSTRAINT "CustomerPackageUsage_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CustomerPackageUsageItem" ADD CONSTRAINT "CustomerPackageUsageItem_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CustomerPackageUsageItem" ADD CONSTRAINT "CustomerPackageUsageItem_usageId_fkey" FOREIGN KEY ("usageId") REFERENCES "CustomerPackageUsage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomerPackageUsageItem" ADD CONSTRAINT "CustomerPackageUsageItem_customerPackageServiceBalanceId_fkey" FOREIGN KEY ("customerPackageServiceBalanceId") REFERENCES "CustomerPackageServiceBalance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CustomerPackageUsageItem" ADD CONSTRAINT "CustomerPackageUsageItem_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CustomerPackageUsageItem" ADD CONSTRAINT "CustomerPackageUsageItem_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
