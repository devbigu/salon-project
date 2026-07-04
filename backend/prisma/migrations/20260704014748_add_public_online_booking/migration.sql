-- AlterEnum
ALTER TYPE "AuditModule" ADD VALUE 'PUBLIC_BOOKING';

-- AlterTable
ALTER TABLE "Branch" ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Salon" ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "PublicBookingSetting" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "branchId" TEXT,
    "slug" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "allowStaffSelection" BOOLEAN NOT NULL DEFAULT true,
    "requireCustomerOtp" BOOLEAN NOT NULL DEFAULT false,
    "requireApproval" BOOLEAN NOT NULL DEFAULT false,
    "bookingWindowDays" INTEGER NOT NULL DEFAULT 30,
    "minNoticeMinutes" INTEGER NOT NULL DEFAULT 120,
    "slotIntervalMinutes" INTEGER NOT NULL DEFAULT 15,
    "cancellationPolicyText" TEXT,
    "termsText" TEXT,
    "themeColor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicBookingSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PublicBookingSetting_slug_key" ON "PublicBookingSetting"("slug");

-- CreateIndex
CREATE INDEX "PublicBookingSetting_salonId_idx" ON "PublicBookingSetting"("salonId");

-- CreateIndex
CREATE INDEX "PublicBookingSetting_branchId_idx" ON "PublicBookingSetting"("branchId");

-- CreateIndex
CREATE INDEX "PublicBookingSetting_isEnabled_idx" ON "PublicBookingSetting"("isEnabled");

-- CreateIndex
CREATE UNIQUE INDEX "PublicBookingSetting_salonId_branchId_key" ON "PublicBookingSetting"("salonId", "branchId");

-- AddForeignKey
ALTER TABLE "PublicBookingSetting" ADD CONSTRAINT "PublicBookingSetting_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicBookingSetting" ADD CONSTRAINT "PublicBookingSetting_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
