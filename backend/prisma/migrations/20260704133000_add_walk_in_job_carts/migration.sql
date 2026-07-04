CREATE TYPE "AppointmentSource" AS ENUM ('INTERNAL', 'PUBLIC', 'WALK_IN');

ALTER TABLE "Appointment"
  ALTER COLUMN "staffId" DROP NOT NULL,
  ADD COLUMN "source" "AppointmentSource" NOT NULL DEFAULT 'INTERNAL',
  ADD COLUMN "walkInJobCart" BOOLEAN NOT NULL DEFAULT false;

ALTER TYPE "AuditModule" ADD VALUE 'JOB_CART';

CREATE INDEX "Appointment_salonId_walkInJobCart_createdAt_idx"
  ON "Appointment"("salonId", "walkInJobCart", "createdAt");
