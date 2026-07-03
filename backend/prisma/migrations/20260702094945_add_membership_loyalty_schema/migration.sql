-- CreateEnum
CREATE TYPE "LoyaltyTransactionType" AS ENUM ('EARNED', 'REDEEMED', 'ADJUSTED', 'EXPIRED');

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "membershipId" TEXT;

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "discountPercentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyRule" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "earnPointsPerAmount" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "earnAmountStep" DECIMAL(10,2) NOT NULL DEFAULT 100,
    "redeemValuePerPoint" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "minRedeemPoints" INTEGER NOT NULL DEFAULT 0,
    "maxRedeemPoints" INTEGER,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyTransaction" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "type" "LoyaltyTransactionType" NOT NULL,
    "points" INTEGER NOT NULL,
    "balanceBefore" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "note" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoyaltyTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Membership_salonId_idx" ON "Membership"("salonId");

-- CreateIndex
CREATE INDEX "Membership_status_idx" ON "Membership"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_salonId_name_key" ON "Membership"("salonId", "name");

-- CreateIndex
CREATE INDEX "LoyaltyRule_salonId_idx" ON "LoyaltyRule"("salonId");

-- CreateIndex
CREATE INDEX "LoyaltyRule_status_idx" ON "LoyaltyRule"("status");

-- CreateIndex
CREATE INDEX "LoyaltyTransaction_salonId_idx" ON "LoyaltyTransaction"("salonId");

-- CreateIndex
CREATE INDEX "LoyaltyTransaction_customerId_idx" ON "LoyaltyTransaction"("customerId");

-- CreateIndex
CREATE INDEX "LoyaltyTransaction_type_idx" ON "LoyaltyTransaction"("type");

-- CreateIndex
CREATE INDEX "LoyaltyTransaction_createdById_idx" ON "LoyaltyTransaction"("createdById");

-- CreateIndex
CREATE INDEX "LoyaltyTransaction_createdAt_idx" ON "LoyaltyTransaction"("createdAt");

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyRule" ADD CONSTRAINT "LoyaltyRule_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyTransaction" ADD CONSTRAINT "LoyaltyTransaction_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyTransaction" ADD CONSTRAINT "LoyaltyTransaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyTransaction" ADD CONSTRAINT "LoyaltyTransaction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
