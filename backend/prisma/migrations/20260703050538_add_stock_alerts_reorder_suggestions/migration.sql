-- CreateEnum
CREATE TYPE "StockAlertStatus" AS ENUM ('OPEN', 'RESOLVED');

-- CreateEnum
CREATE TYPE "ReorderSuggestionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CONVERTED_TO_PURCHASE');

-- CreateTable
CREATE TABLE "StockAlert" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "branchId" TEXT,
    "productId" TEXT NOT NULL,
    "currentStock" DECIMAL(10,2) NOT NULL,
    "threshold" DECIMAL(10,2) NOT NULL,
    "status" "StockAlertStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "StockAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReorderSuggestion" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "branchId" TEXT,
    "productId" TEXT NOT NULL,
    "vendorId" TEXT,
    "suggestedQuantity" DECIMAL(10,2) NOT NULL,
    "status" "ReorderSuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "convertedPurchaseId" TEXT,

    CONSTRAINT "ReorderSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StockAlert_salonId_idx" ON "StockAlert"("salonId");

-- CreateIndex
CREATE INDEX "StockAlert_branchId_idx" ON "StockAlert"("branchId");

-- CreateIndex
CREATE INDEX "StockAlert_productId_idx" ON "StockAlert"("productId");

-- CreateIndex
CREATE INDEX "StockAlert_status_idx" ON "StockAlert"("status");

-- CreateIndex
CREATE INDEX "StockAlert_createdAt_idx" ON "StockAlert"("createdAt");

-- CreateIndex
CREATE INDEX "ReorderSuggestion_salonId_idx" ON "ReorderSuggestion"("salonId");

-- CreateIndex
CREATE INDEX "ReorderSuggestion_branchId_idx" ON "ReorderSuggestion"("branchId");

-- CreateIndex
CREATE INDEX "ReorderSuggestion_productId_idx" ON "ReorderSuggestion"("productId");

-- CreateIndex
CREATE INDEX "ReorderSuggestion_vendorId_idx" ON "ReorderSuggestion"("vendorId");

-- CreateIndex
CREATE INDEX "ReorderSuggestion_status_idx" ON "ReorderSuggestion"("status");

-- CreateIndex
CREATE INDEX "ReorderSuggestion_createdAt_idx" ON "ReorderSuggestion"("createdAt");

-- CreateIndex
CREATE INDEX "ReorderSuggestion_convertedPurchaseId_idx" ON "ReorderSuggestion"("convertedPurchaseId");

-- AddForeignKey
ALTER TABLE "StockAlert" ADD CONSTRAINT "StockAlert_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAlert" ADD CONSTRAINT "StockAlert_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAlert" ADD CONSTRAINT "StockAlert_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReorderSuggestion" ADD CONSTRAINT "ReorderSuggestion_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReorderSuggestion" ADD CONSTRAINT "ReorderSuggestion_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReorderSuggestion" ADD CONSTRAINT "ReorderSuggestion_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReorderSuggestion" ADD CONSTRAINT "ReorderSuggestion_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReorderSuggestion" ADD CONSTRAINT "ReorderSuggestion_convertedPurchaseId_fkey" FOREIGN KEY ("convertedPurchaseId") REFERENCES "ProductPurchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
