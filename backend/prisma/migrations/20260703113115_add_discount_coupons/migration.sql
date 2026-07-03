-- AlterEnum
ALTER TYPE "AuditModule" ADD VALUE 'COUPON';

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "couponCodeSnapshot" TEXT,
ADD COLUMN     "couponDiscountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "couponId" TEXT;

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "branchId" TEXT,
    "couponCode" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "discountPercentage" DECIMAL(5,2) NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxUsageCount" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "minInvoiceAmount" DECIMAL(10,2),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Coupon_salonId_idx" ON "Coupon"("salonId");

-- CreateIndex
CREATE INDEX "Coupon_branchId_idx" ON "Coupon"("branchId");

-- CreateIndex
CREATE INDEX "Coupon_couponCode_idx" ON "Coupon"("couponCode");

-- CreateIndex
CREATE INDEX "Coupon_isActive_idx" ON "Coupon"("isActive");

-- CreateIndex
CREATE INDEX "Coupon_validFrom_idx" ON "Coupon"("validFrom");

-- CreateIndex
CREATE INDEX "Coupon_validUntil_idx" ON "Coupon"("validUntil");

-- CreateIndex
CREATE INDEX "Coupon_createdById_idx" ON "Coupon"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_salonId_couponCode_key" ON "Coupon"("salonId", "couponCode");

-- CreateIndex
CREATE INDEX "Invoice_couponId_idx" ON "Invoice"("couponId");

-- AddForeignKey
ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;
