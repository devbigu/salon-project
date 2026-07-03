-- CreateEnum
CREATE TYPE "AuditModule" AS ENUM ('AUTH', 'APPOINTMENT', 'INVOICE', 'PAYMENT', 'SALARY', 'CUSTOMER', 'STAFF', 'INVENTORY', 'SUPPORT_TICKET', 'REORDER', 'MEMBERSHIP', 'LOYALTY', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'CANCEL', 'COMPLETE', 'PAYMENT_RECORDED', 'STOCK_MOVEMENT', 'SALARY_CHANGED', 'SALARY_GENERATED', 'SALARY_PAID', 'SUPPORT_RESOLVED', 'APPROVE', 'REJECT', 'CONVERT', 'STATUS_CHANGE');

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "salonId" TEXT,
    "branchId" TEXT,
    "userId" TEXT,
    "userName" TEXT,
    "userRole" "Role",
    "module" "AuditModule" NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entityId" TEXT,
    "entityCode" TEXT,
    "entityName" TEXT,
    "description" TEXT NOT NULL,
    "oldData" JSONB,
    "newData" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_salonId_idx" ON "AuditLog"("salonId");

-- CreateIndex
CREATE INDEX "AuditLog_branchId_idx" ON "AuditLog"("branchId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_module_idx" ON "AuditLog"("module");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entityId_idx" ON "AuditLog"("entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
