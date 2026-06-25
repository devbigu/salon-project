CREATE TYPE "ProductUnit" AS ENUM ('PCS', 'ML', 'LITER', 'GRAM', 'KG', 'PACK', 'BOX', 'BOTTLE', 'TUBE');
CREATE TYPE "ProductStockMovementType" AS ENUM ('STOCK_IN', 'STOCK_OUT', 'RETAIL_SALE', 'USED_IN_SERVICE', 'DAMAGED', 'ADJUSTMENT', 'RETURNED');

CREATE TABLE "ProductBrand" (
  "id" TEXT NOT NULL, "salonId" TEXT NOT NULL, "name" TEXT NOT NULL,
  "description" TEXT, "status" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductBrand_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Product" (
  "id" TEXT NOT NULL, "salonId" TEXT NOT NULL, "branchId" TEXT, "brandId" TEXT,
  "name" TEXT NOT NULL, "description" TEXT, "sku" TEXT, "barcode" TEXT, "category" TEXT,
  "unit" "ProductUnit" NOT NULL DEFAULT 'PCS',
  "costPrice" DECIMAL(10,2) NOT NULL DEFAULT 0, "sellingPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "currentStock" DECIMAL(10,2) NOT NULL DEFAULT 0, "lowStockAlert" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "isRetailProduct" BOOLEAN NOT NULL DEFAULT false, "status" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ProductStockMovement" (
  "id" TEXT NOT NULL, "salonId" TEXT NOT NULL, "branchId" TEXT, "productId" TEXT NOT NULL,
  "type" "ProductStockMovementType" NOT NULL, "quantity" DECIMAL(10,2) NOT NULL,
  "stockBefore" DECIMAL(10,2) NOT NULL, "stockAfter" DECIMAL(10,2) NOT NULL,
  "reason" TEXT, "note" TEXT, "referenceType" TEXT, "referenceId" TEXT, "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductStockMovement_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ProductPurchase" (
  "id" TEXT NOT NULL, "purchaseCode" TEXT NOT NULL, "salonId" TEXT NOT NULL, "branchId" TEXT,
  "supplierName" TEXT, "supplierPhone" TEXT, "invoiceNo" TEXT,
  "purchaseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "subtotalAmount" DECIMAL(10,2) NOT NULL DEFAULT 0, "totalAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "note" TEXT, "createdById" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "ProductPurchase_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ProductPurchaseItem" (
  "id" TEXT NOT NULL, "purchaseId" TEXT NOT NULL, "productId" TEXT NOT NULL,
  "quantity" DECIMAL(10,2) NOT NULL, "unitCost" DECIMAL(10,2) NOT NULL,
  "totalCost" DECIMAL(10,2) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductPurchaseItem_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "RetailSale" (
  "id" TEXT NOT NULL, "saleCode" TEXT NOT NULL, "salonId" TEXT NOT NULL, "branchId" TEXT,
  "customerId" TEXT, "saleDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "subtotalAmount" DECIMAL(10,2) NOT NULL DEFAULT 0, "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "totalAmount" DECIMAL(10,2) NOT NULL DEFAULT 0, "paymentMethod" "PaymentMethod",
  "note" TEXT, "createdById" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "RetailSale_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "RetailSaleItem" (
  "id" TEXT NOT NULL, "saleId" TEXT NOT NULL, "productId" TEXT NOT NULL,
  "quantity" DECIMAL(10,2) NOT NULL, "unitPrice" DECIMAL(10,2) NOT NULL,
  "totalPrice" DECIMAL(10,2) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RetailSaleItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductBrand_salonId_name_key" ON "ProductBrand"("salonId","name");
CREATE UNIQUE INDEX "Product_salonId_name_key" ON "Product"("salonId","name");
CREATE UNIQUE INDEX "ProductPurchase_salonId_purchaseCode_key" ON "ProductPurchase"("salonId","purchaseCode");
CREATE UNIQUE INDEX "RetailSale_salonId_saleCode_key" ON "RetailSale"("salonId","saleCode");
CREATE INDEX "ProductBrand_salonId_idx" ON "ProductBrand"("salonId");
CREATE INDEX "ProductBrand_status_idx" ON "ProductBrand"("status");
CREATE INDEX "Product_salonId_idx" ON "Product"("salonId");
CREATE INDEX "Product_branchId_idx" ON "Product"("branchId");
CREATE INDEX "Product_brandId_idx" ON "Product"("brandId");
CREATE INDEX "Product_sku_idx" ON "Product"("sku");
CREATE INDEX "Product_barcode_idx" ON "Product"("barcode");
CREATE INDEX "Product_status_idx" ON "Product"("status");
CREATE INDEX "Product_isRetailProduct_idx" ON "Product"("isRetailProduct");
CREATE INDEX "ProductStockMovement_salonId_idx" ON "ProductStockMovement"("salonId");
CREATE INDEX "ProductStockMovement_branchId_idx" ON "ProductStockMovement"("branchId");
CREATE INDEX "ProductStockMovement_productId_idx" ON "ProductStockMovement"("productId");
CREATE INDEX "ProductStockMovement_type_idx" ON "ProductStockMovement"("type");
CREATE INDEX "ProductStockMovement_createdById_idx" ON "ProductStockMovement"("createdById");
CREATE INDEX "ProductStockMovement_createdAt_idx" ON "ProductStockMovement"("createdAt");
CREATE INDEX "ProductPurchase_salonId_idx" ON "ProductPurchase"("salonId");
CREATE INDEX "ProductPurchase_branchId_idx" ON "ProductPurchase"("branchId");
CREATE INDEX "ProductPurchase_createdById_idx" ON "ProductPurchase"("createdById");
CREATE INDEX "ProductPurchase_purchaseDate_idx" ON "ProductPurchase"("purchaseDate");
CREATE INDEX "ProductPurchaseItem_purchaseId_idx" ON "ProductPurchaseItem"("purchaseId");
CREATE INDEX "ProductPurchaseItem_productId_idx" ON "ProductPurchaseItem"("productId");
CREATE INDEX "RetailSale_salonId_idx" ON "RetailSale"("salonId");
CREATE INDEX "RetailSale_branchId_idx" ON "RetailSale"("branchId");
CREATE INDEX "RetailSale_customerId_idx" ON "RetailSale"("customerId");
CREATE INDEX "RetailSale_createdById_idx" ON "RetailSale"("createdById");
CREATE INDEX "RetailSale_saleDate_idx" ON "RetailSale"("saleDate");
CREATE INDEX "RetailSaleItem_saleId_idx" ON "RetailSaleItem"("saleId");
CREATE INDEX "RetailSaleItem_productId_idx" ON "RetailSaleItem"("productId");

ALTER TABLE "ProductBrand" ADD CONSTRAINT "ProductBrand_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "ProductBrand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductStockMovement" ADD CONSTRAINT "ProductStockMovement_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProductStockMovement" ADD CONSTRAINT "ProductStockMovement_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductStockMovement" ADD CONSTRAINT "ProductStockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProductStockMovement" ADD CONSTRAINT "ProductStockMovement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductPurchase" ADD CONSTRAINT "ProductPurchase_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProductPurchase" ADD CONSTRAINT "ProductPurchase_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductPurchase" ADD CONSTRAINT "ProductPurchase_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductPurchaseItem" ADD CONSTRAINT "ProductPurchaseItem_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "ProductPurchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductPurchaseItem" ADD CONSTRAINT "ProductPurchaseItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RetailSale" ADD CONSTRAINT "RetailSale_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RetailSale" ADD CONSTRAINT "RetailSale_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RetailSale" ADD CONSTRAINT "RetailSale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RetailSale" ADD CONSTRAINT "RetailSale_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RetailSaleItem" ADD CONSTRAINT "RetailSaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "RetailSale"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RetailSaleItem" ADD CONSTRAINT "RetailSaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
