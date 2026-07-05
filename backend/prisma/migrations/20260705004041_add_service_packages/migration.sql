-- CreateEnum
CREATE TYPE "PackageStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "CustomerPackageStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'USED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PackageItemType" AS ENUM ('SERVICE');

-- CreateEnum
CREATE TYPE "InvoiceItemType" AS ENUM ('SERVICE', 'PACKAGE');

-- AlterEnum
ALTER TYPE "AuditModule" ADD VALUE 'PACKAGE';

-- DropForeignKey
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_staffId_fkey";

-- AlterTable
ALTER TABLE "InvoiceItem" ADD COLUMN     "itemType" "InvoiceItemType" NOT NULL DEFAULT 'SERVICE',
ADD COLUMN     "packageId" TEXT,
ADD COLUMN     "soldByStaffId" TEXT;

-- CreateTable
CREATE TABLE "PackageCategory" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "branchId" TEXT,
    "name" TEXT NOT NULL,
    "status" "PackageStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackageCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServicePackage" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "branchId" TEXT,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "specialPrice" DECIMAL(10,2) NOT NULL,
    "validityDays" INTEGER NOT NULL,
    "status" "PackageStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServicePackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServicePackageItem" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "itemType" "PackageItemType" NOT NULL DEFAULT 'SERVICE',
    "serviceNameSnapshot" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "priceSnapshot" DECIMAL(10,2) NOT NULL,
    "durationMinutesSnapshot" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServicePackageItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerPackage" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "packageNameSnapshot" TEXT NOT NULL,
    "totalPriceSnapshot" DECIMAL(10,2) NOT NULL,
    "specialPriceSnapshot" DECIMAL(10,2) NOT NULL,
    "validityDaysSnapshot" INTEGER NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "status" "CustomerPackageStatus" NOT NULL DEFAULT 'ACTIVE',
    "soldByStaffId" TEXT,
    "invoiceId" TEXT,
    "jobCartAppointmentId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerPackage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PackageCategory_salonId_idx" ON "PackageCategory"("salonId");

-- CreateIndex
CREATE INDEX "PackageCategory_branchId_idx" ON "PackageCategory"("branchId");

-- CreateIndex
CREATE INDEX "PackageCategory_status_idx" ON "PackageCategory"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PackageCategory_salonId_name_key" ON "PackageCategory"("salonId", "name");

-- CreateIndex
CREATE INDEX "ServicePackage_salonId_idx" ON "ServicePackage"("salonId");

-- CreateIndex
CREATE INDEX "ServicePackage_branchId_idx" ON "ServicePackage"("branchId");

-- CreateIndex
CREATE INDEX "ServicePackage_categoryId_idx" ON "ServicePackage"("categoryId");

-- CreateIndex
CREATE INDEX "ServicePackage_status_idx" ON "ServicePackage"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ServicePackage_salonId_name_key" ON "ServicePackage"("salonId", "name");

-- CreateIndex
CREATE INDEX "ServicePackageItem_packageId_idx" ON "ServicePackageItem"("packageId");

-- CreateIndex
CREATE INDEX "ServicePackageItem_serviceId_idx" ON "ServicePackageItem"("serviceId");

-- CreateIndex
CREATE INDEX "ServicePackageItem_salonId_idx" ON "ServicePackageItem"("salonId");

-- CreateIndex
CREATE UNIQUE INDEX "ServicePackageItem_packageId_serviceId_key" ON "ServicePackageItem"("packageId", "serviceId");

-- CreateIndex
CREATE INDEX "CustomerPackage_salonId_idx" ON "CustomerPackage"("salonId");

-- CreateIndex
CREATE INDEX "CustomerPackage_branchId_idx" ON "CustomerPackage"("branchId");

-- CreateIndex
CREATE INDEX "CustomerPackage_customerId_idx" ON "CustomerPackage"("customerId");

-- CreateIndex
CREATE INDEX "CustomerPackage_packageId_idx" ON "CustomerPackage"("packageId");

-- CreateIndex
CREATE INDEX "CustomerPackage_invoiceId_idx" ON "CustomerPackage"("invoiceId");

-- CreateIndex
CREATE INDEX "CustomerPackage_jobCartAppointmentId_idx" ON "CustomerPackage"("jobCartAppointmentId");

-- CreateIndex
CREATE INDEX "CustomerPackage_soldByStaffId_idx" ON "CustomerPackage"("soldByStaffId");

-- CreateIndex
CREATE INDEX "CustomerPackage_status_idx" ON "CustomerPackage"("status");

-- CreateIndex
CREATE INDEX "CustomerPackage_validUntil_idx" ON "CustomerPackage"("validUntil");

-- CreateIndex
CREATE INDEX "InvoiceItem_packageId_idx" ON "InvoiceItem"("packageId");

-- CreateIndex
CREATE INDEX "InvoiceItem_soldByStaffId_idx" ON "InvoiceItem"("soldByStaffId");

-- CreateIndex
CREATE INDEX "InvoiceItem_itemType_idx" ON "InvoiceItem"("itemType");

-- AddForeignKey
ALTER TABLE "PackageCategory" ADD CONSTRAINT "PackageCategory_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageCategory" ADD CONSTRAINT "PackageCategory_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageCategory" ADD CONSTRAINT "PackageCategory_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicePackage" ADD CONSTRAINT "ServicePackage_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicePackage" ADD CONSTRAINT "ServicePackage_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicePackage" ADD CONSTRAINT "ServicePackage_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "PackageCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicePackage" ADD CONSTRAINT "ServicePackage_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicePackageItem" ADD CONSTRAINT "ServicePackageItem_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicePackageItem" ADD CONSTRAINT "ServicePackageItem_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "ServicePackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicePackageItem" ADD CONSTRAINT "ServicePackageItem_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "ServicePackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_soldByStaffId_fkey" FOREIGN KEY ("soldByStaffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerPackage" ADD CONSTRAINT "CustomerPackage_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerPackage" ADD CONSTRAINT "CustomerPackage_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerPackage" ADD CONSTRAINT "CustomerPackage_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerPackage" ADD CONSTRAINT "CustomerPackage_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "ServicePackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerPackage" ADD CONSTRAINT "CustomerPackage_soldByStaffId_fkey" FOREIGN KEY ("soldByStaffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerPackage" ADD CONSTRAINT "CustomerPackage_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerPackage" ADD CONSTRAINT "CustomerPackage_jobCartAppointmentId_fkey" FOREIGN KEY ("jobCartAppointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerPackage" ADD CONSTRAINT "CustomerPackage_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
