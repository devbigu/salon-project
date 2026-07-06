-- CreateEnum
CREATE TYPE "StaffAvailabilityStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "StaffTimeBlockType" AS ENUM ('BREAK', 'PERSONAL', 'TRAINING', 'MEETING', 'OFF', 'OTHER');

-- CreateTable
CREATE TABLE "StaffAvailabilityRule" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTimeMinutes" INTEGER NOT NULL,
    "endTimeMinutes" INTEGER NOT NULL,
    "effectiveFrom" DATE,
    "effectiveUntil" DATE,
    "status" "StaffAvailabilityStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffAvailabilityRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffTimeBlock" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "type" "StaffTimeBlockType" NOT NULL,
    "note" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffTimeBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StaffAvailabilityRule_salonId_idx" ON "StaffAvailabilityRule"("salonId");

-- CreateIndex
CREATE INDEX "StaffAvailabilityRule_branchId_idx" ON "StaffAvailabilityRule"("branchId");

-- CreateIndex
CREATE INDEX "StaffAvailabilityRule_staffId_idx" ON "StaffAvailabilityRule"("staffId");

-- CreateIndex
CREATE INDEX "StaffAvailabilityRule_dayOfWeek_idx" ON "StaffAvailabilityRule"("dayOfWeek");

-- CreateIndex
CREATE INDEX "StaffAvailabilityRule_status_idx" ON "StaffAvailabilityRule"("status");

-- CreateIndex
CREATE INDEX "StaffAvailabilityRule_effectiveFrom_idx" ON "StaffAvailabilityRule"("effectiveFrom");

-- CreateIndex
CREATE INDEX "StaffAvailabilityRule_effectiveUntil_idx" ON "StaffAvailabilityRule"("effectiveUntil");

-- CreateIndex
CREATE INDEX "StaffTimeBlock_salonId_idx" ON "StaffTimeBlock"("salonId");

-- CreateIndex
CREATE INDEX "StaffTimeBlock_branchId_idx" ON "StaffTimeBlock"("branchId");

-- CreateIndex
CREATE INDEX "StaffTimeBlock_staffId_idx" ON "StaffTimeBlock"("staffId");

-- CreateIndex
CREATE INDEX "StaffTimeBlock_date_idx" ON "StaffTimeBlock"("date");

-- CreateIndex
CREATE INDEX "StaffTimeBlock_startTime_idx" ON "StaffTimeBlock"("startTime");

-- CreateIndex
CREATE INDEX "StaffTimeBlock_endTime_idx" ON "StaffTimeBlock"("endTime");

-- AddForeignKey
ALTER TABLE "StaffAvailabilityRule" ADD CONSTRAINT "StaffAvailabilityRule_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAvailabilityRule" ADD CONSTRAINT "StaffAvailabilityRule_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAvailabilityRule" ADD CONSTRAINT "StaffAvailabilityRule_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAvailabilityRule" ADD CONSTRAINT "StaffAvailabilityRule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffTimeBlock" ADD CONSTRAINT "StaffTimeBlock_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffTimeBlock" ADD CONSTRAINT "StaffTimeBlock_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffTimeBlock" ADD CONSTRAINT "StaffTimeBlock_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffTimeBlock" ADD CONSTRAINT "StaffTimeBlock_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
