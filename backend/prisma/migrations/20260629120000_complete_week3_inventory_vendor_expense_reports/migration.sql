CREATE TYPE "ExpenseCategory" AS ENUM (
  'RENT',
  'UTILITIES',
  'INTERNET',
  'MAINTENANCE',
  'PRODUCT_PURCHASE',
  'VENDOR_PAYMENT',
  'STAFF_ADVANCE',
  'PETTY_CASH',
  'MISC'
);

ALTER TABLE "Product"
  ADD COLUMN "vendorId" TEXT,
  ADD COLUMN "isServiceConsumable" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "ProductPurchase"
  ADD COLUMN "vendorId" TEXT,
  ADD COLUMN "paidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN "balanceAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID';

UPDATE "ProductPurchase"
SET "balanceAmount" = "totalAmount";

CREATE TABLE "Vendor" (
  "id" TEXT NOT NULL,
  "salonId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "contactPerson" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "gst" TEXT,
  "paymentTerms" TEXT,
  "status" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VendorPayment" (
  "id" TEXT NOT NULL,
  "salonId" TEXT NOT NULL,
  "branchId" TEXT,
  "vendorId" TEXT NOT NULL,
  "purchaseId" TEXT,
  "amount" DECIMAL(10,2) NOT NULL,
  "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "paymentMethod" "PaymentMethod" NOT NULL,
  "referenceNo" TEXT,
  "note" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VendorPayment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Expense" (
  "id" TEXT NOT NULL,
  "salonId" TEXT NOT NULL,
  "branchId" TEXT,
  "vendorId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "category" "ExpenseCategory" NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "paymentMethod" "PaymentMethod",
  "expenseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "note" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Vendor_salonId_name_key" ON "Vendor"("salonId", "name");
CREATE INDEX "Vendor_salonId_idx" ON "Vendor"("salonId");
CREATE INDEX "Vendor_status_idx" ON "Vendor"("status");
CREATE INDEX "Product_vendorId_idx" ON "Product"("vendorId");
CREATE INDEX "ProductPurchase_vendorId_idx" ON "ProductPurchase"("vendorId");
CREATE INDEX "VendorPayment_salonId_idx" ON "VendorPayment"("salonId");
CREATE INDEX "VendorPayment_branchId_idx" ON "VendorPayment"("branchId");
CREATE INDEX "VendorPayment_vendorId_idx" ON "VendorPayment"("vendorId");
CREATE INDEX "VendorPayment_purchaseId_idx" ON "VendorPayment"("purchaseId");
CREATE INDEX "VendorPayment_createdById_idx" ON "VendorPayment"("createdById");
CREATE INDEX "VendorPayment_paymentDate_idx" ON "VendorPayment"("paymentDate");
CREATE INDEX "Expense_salonId_idx" ON "Expense"("salonId");
CREATE INDEX "Expense_branchId_idx" ON "Expense"("branchId");
CREATE INDEX "Expense_vendorId_idx" ON "Expense"("vendorId");
CREATE INDEX "Expense_category_idx" ON "Expense"("category");
CREATE INDEX "Expense_createdById_idx" ON "Expense"("createdById");
CREATE INDEX "Expense_expenseDate_idx" ON "Expense"("expenseDate");

ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_salonId_fkey"
  FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_vendorId_fkey"
  FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductPurchase" ADD CONSTRAINT "ProductPurchase_vendorId_fkey"
  FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "VendorPayment" ADD CONSTRAINT "VendorPayment_salonId_fkey"
  FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VendorPayment" ADD CONSTRAINT "VendorPayment_branchId_fkey"
  FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "VendorPayment" ADD CONSTRAINT "VendorPayment_vendorId_fkey"
  FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VendorPayment" ADD CONSTRAINT "VendorPayment_purchaseId_fkey"
  FOREIGN KEY ("purchaseId") REFERENCES "ProductPurchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "VendorPayment" ADD CONSTRAINT "VendorPayment_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_salonId_fkey"
  FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_branchId_fkey"
  FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_vendorId_fkey"
  FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
