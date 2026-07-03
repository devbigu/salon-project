-- CreateTable
CREATE TABLE "ServiceConsumable" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceConsumable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServiceConsumable_salonId_serviceId_productId_key" ON "ServiceConsumable"("salonId", "serviceId", "productId");

-- CreateIndex
CREATE INDEX "ServiceConsumable_salonId_idx" ON "ServiceConsumable"("salonId");

-- CreateIndex
CREATE INDEX "ServiceConsumable_serviceId_idx" ON "ServiceConsumable"("serviceId");

-- CreateIndex
CREATE INDEX "ServiceConsumable_productId_idx" ON "ServiceConsumable"("productId");

-- CreateIndex
CREATE INDEX "ServiceConsumable_status_idx" ON "ServiceConsumable"("status");

-- AddForeignKey
ALTER TABLE "ServiceConsumable" ADD CONSTRAINT "ServiceConsumable_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceConsumable" ADD CONSTRAINT "ServiceConsumable_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceConsumable" ADD CONSTRAINT "ServiceConsumable_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
