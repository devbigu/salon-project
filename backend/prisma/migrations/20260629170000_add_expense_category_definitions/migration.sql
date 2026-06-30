CREATE TABLE "ExpenseCategoryDefinition" (
  "id" TEXT NOT NULL,
  "salonId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "status" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExpenseCategoryDefinition_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Expense"
  ALTER COLUMN "category" TYPE TEXT USING "category"::TEXT,
  ADD COLUMN "categoryDefinitionId" TEXT;

CREATE UNIQUE INDEX "ExpenseCategoryDefinition_salonId_name_key"
  ON "ExpenseCategoryDefinition"("salonId", "name");
CREATE INDEX "ExpenseCategoryDefinition_salonId_idx"
  ON "ExpenseCategoryDefinition"("salonId");
CREATE INDEX "ExpenseCategoryDefinition_status_idx"
  ON "ExpenseCategoryDefinition"("status");
CREATE INDEX "Expense_categoryDefinitionId_idx"
  ON "Expense"("categoryDefinitionId");

ALTER TABLE "ExpenseCategoryDefinition"
  ADD CONSTRAINT "ExpenseCategoryDefinition_salonId_fkey"
  FOREIGN KEY ("salonId") REFERENCES "Salon"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Expense"
  ADD CONSTRAINT "Expense_categoryDefinitionId_fkey"
  FOREIGN KEY ("categoryDefinitionId") REFERENCES "ExpenseCategoryDefinition"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "ExpenseCategoryDefinition" (
  "id", "salonId", "name", "status", "createdAt", "updatedAt"
)
SELECT
  md5(s."id" || ':expense-category:' || defaults."name"),
  s."id",
  defaults."name",
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Salon" s
CROSS JOIN (
  VALUES
    ('Rent'),
    ('Utilities'),
    ('Internet'),
    ('Maintenance'),
    ('Product Purchase'),
    ('Vendor Payment'),
    ('Staff Advance'),
    ('Petty Cash'),
    ('Miscellaneous')
) AS defaults("name")
ON CONFLICT ("salonId", "name") DO NOTHING;

UPDATE "Expense" e
SET "categoryDefinitionId" = definition."id"
FROM "ExpenseCategoryDefinition" definition
WHERE definition."salonId" = e."salonId"
  AND definition."name" = CASE e."category"
    WHEN 'RENT' THEN 'Rent'
    WHEN 'UTILITIES' THEN 'Utilities'
    WHEN 'INTERNET' THEN 'Internet'
    WHEN 'MAINTENANCE' THEN 'Maintenance'
    WHEN 'PRODUCT_PURCHASE' THEN 'Product Purchase'
    WHEN 'VENDOR_PAYMENT' THEN 'Vendor Payment'
    WHEN 'STAFF_ADVANCE' THEN 'Staff Advance'
    WHEN 'PETTY_CASH' THEN 'Petty Cash'
    ELSE 'Miscellaneous'
  END;

UPDATE "Expense" e
SET "category" = definition."name"
FROM "ExpenseCategoryDefinition" definition
WHERE definition."id" = e."categoryDefinitionId";
