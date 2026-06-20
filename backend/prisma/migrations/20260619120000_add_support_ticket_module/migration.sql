-- CreateEnum
CREATE TYPE "SupportTicketCategory" AS ENUM (
  'LOGIN_ISSUE',
  'CUSTOMER_MODULE',
  'APPOINTMENT_MODULE',
  'STAFF_MODULE',
  'SERVICE_MODULE',
  'BILLING_INVOICE',
  'PAYMENT_MODULE',
  'REPORTS',
  'PERFORMANCE',
  'BUG',
  'OTHER'
);

-- CreateEnum
CREATE TYPE "SupportTicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "SupportTicketStatus" AS ENUM (
  'OPEN',
  'IN_PROGRESS',
  'WAITING_FOR_USER',
  'RESOLVED',
  'CLOSED',
  'REJECTED'
);

-- CreateEnum
CREATE TYPE "SupportTicketSource" AS ENUM ('LOGIN_PAGE', 'DASHBOARD');

-- CreateTable
CREATE TABLE "SupportTicket" (
  "id" TEXT NOT NULL,
  "ticketCode" TEXT NOT NULL,
  "salonId" TEXT,
  "branchId" TEXT,
  "reporterId" TEXT,
  "reporterName" TEXT,
  "reporterEmail" TEXT NOT NULL,
  "reporterPhone" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" "SupportTicketCategory" NOT NULL DEFAULT 'OTHER',
  "priority" "SupportTicketPriority" NOT NULL DEFAULT 'MEDIUM',
  "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
  "source" "SupportTicketSource" NOT NULL DEFAULT 'DASHBOARD',
  "pageUrl" TEXT,
  "browserInfo" TEXT,
  "errorMessage" TEXT,
  "assignedToId" TEXT,
  "resolutionNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicketMessage" (
  "id" TEXT NOT NULL,
  "ticketId" TEXT NOT NULL,
  "senderId" TEXT,
  "senderEmail" TEXT,
  "message" TEXT NOT NULL,
  "isInternalNote" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SupportTicketMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicketStatusHistory" (
  "id" TEXT NOT NULL,
  "ticketId" TEXT NOT NULL,
  "oldStatus" "SupportTicketStatus",
  "newStatus" "SupportTicketStatus" NOT NULL,
  "changedById" TEXT,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SupportTicketStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SupportTicket_ticketCode_key" ON "SupportTicket"("ticketCode");

-- CreateIndex
CREATE INDEX "SupportTicket_salonId_idx" ON "SupportTicket"("salonId");

-- CreateIndex
CREATE INDEX "SupportTicket_branchId_idx" ON "SupportTicket"("branchId");

-- CreateIndex
CREATE INDEX "SupportTicket_reporterId_idx" ON "SupportTicket"("reporterId");

-- CreateIndex
CREATE INDEX "SupportTicket_reporterEmail_idx" ON "SupportTicket"("reporterEmail");

-- CreateIndex
CREATE INDEX "SupportTicket_assignedToId_idx" ON "SupportTicket"("assignedToId");

-- CreateIndex
CREATE INDEX "SupportTicket_status_idx" ON "SupportTicket"("status");

-- CreateIndex
CREATE INDEX "SupportTicket_priority_idx" ON "SupportTicket"("priority");

-- CreateIndex
CREATE INDEX "SupportTicket_category_idx" ON "SupportTicket"("category");

-- CreateIndex
CREATE INDEX "SupportTicket_createdAt_idx" ON "SupportTicket"("createdAt");

-- CreateIndex
CREATE INDEX "SupportTicketMessage_ticketId_idx" ON "SupportTicketMessage"("ticketId");

-- CreateIndex
CREATE INDEX "SupportTicketMessage_senderId_idx" ON "SupportTicketMessage"("senderId");

-- CreateIndex
CREATE INDEX "SupportTicketStatusHistory_ticketId_idx" ON "SupportTicketStatusHistory"("ticketId");

-- CreateIndex
CREATE INDEX "SupportTicketStatusHistory_changedById_idx" ON "SupportTicketStatusHistory"("changedById");

-- CreateIndex
CREATE INDEX "SupportTicketStatusHistory_newStatus_idx" ON "SupportTicketStatusHistory"("newStatus");

-- CreateIndex
CREATE INDEX "SupportTicketStatusHistory_createdAt_idx" ON "SupportTicketStatusHistory"("createdAt");

-- AddForeignKey
ALTER TABLE "SupportTicket"
ADD CONSTRAINT "SupportTicket_salonId_fkey"
FOREIGN KEY ("salonId") REFERENCES "Salon"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket"
ADD CONSTRAINT "SupportTicket_branchId_fkey"
FOREIGN KEY ("branchId") REFERENCES "Branch"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket"
ADD CONSTRAINT "SupportTicket_reporterId_fkey"
FOREIGN KEY ("reporterId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket"
ADD CONSTRAINT "SupportTicket_assignedToId_fkey"
FOREIGN KEY ("assignedToId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicketMessage"
ADD CONSTRAINT "SupportTicketMessage_ticketId_fkey"
FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicketMessage"
ADD CONSTRAINT "SupportTicketMessage_senderId_fkey"
FOREIGN KEY ("senderId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicketStatusHistory"
ADD CONSTRAINT "SupportTicketStatusHistory_ticketId_fkey"
FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicketStatusHistory"
ADD CONSTRAINT "SupportTicketStatusHistory_changedById_fkey"
FOREIGN KEY ("changedById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
