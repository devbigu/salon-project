-- CreateEnum
CREATE TYPE "CustomerMembershipStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED', 'REMOVED');

-- CreateTable
CREATE TABLE "CustomerMembership" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "branchId" TEXT,
    "customerId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "membershipNameSnapshot" TEXT NOT NULL,
    "discountPercentageSnapshot" DECIMAL(5,2) NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "status" "CustomerMembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "assignedById" TEXT,
    "removedById" TEXT,
    "removedAt" TIMESTAMP(3),
    "invoiceId" TEXT,
    "jobCartAppointmentId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerMembership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerMembership_salonId_idx" ON "CustomerMembership"("salonId");

-- CreateIndex
CREATE INDEX "CustomerMembership_branchId_idx" ON "CustomerMembership"("branchId");

-- CreateIndex
CREATE INDEX "CustomerMembership_customerId_idx" ON "CustomerMembership"("customerId");

-- CreateIndex
CREATE INDEX "CustomerMembership_membershipId_idx" ON "CustomerMembership"("membershipId");

-- CreateIndex
CREATE INDEX "CustomerMembership_status_idx" ON "CustomerMembership"("status");

-- CreateIndex
CREATE INDEX "CustomerMembership_startsAt_idx" ON "CustomerMembership"("startsAt");

-- CreateIndex
CREATE INDEX "CustomerMembership_expiresAt_idx" ON "CustomerMembership"("expiresAt");

-- CreateIndex
CREATE INDEX "CustomerMembership_invoiceId_idx" ON "CustomerMembership"("invoiceId");

-- CreateIndex
CREATE INDEX "CustomerMembership_jobCartAppointmentId_idx" ON "CustomerMembership"("jobCartAppointmentId");

-- AddForeignKey
ALTER TABLE "CustomerMembership" ADD CONSTRAINT "CustomerMembership_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerMembership" ADD CONSTRAINT "CustomerMembership_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerMembership" ADD CONSTRAINT "CustomerMembership_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerMembership" ADD CONSTRAINT "CustomerMembership_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerMembership" ADD CONSTRAINT "CustomerMembership_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerMembership" ADD CONSTRAINT "CustomerMembership_removedById_fkey" FOREIGN KEY ("removedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerMembership" ADD CONSTRAINT "CustomerMembership_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerMembership" ADD CONSTRAINT "CustomerMembership_jobCartAppointmentId_fkey" FOREIGN KEY ("jobCartAppointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
