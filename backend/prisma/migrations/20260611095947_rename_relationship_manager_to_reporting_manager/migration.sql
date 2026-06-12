/*
  Warnings:

  - You are about to drop the column `relationshipManagerId` on the `Staff` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Staff" DROP CONSTRAINT "Staff_relationshipManagerId_fkey";

-- AlterTable
ALTER TABLE "Staff" DROP COLUMN "relationshipManagerId",
ADD COLUMN     "reportingManagerId" TEXT;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_reportingManagerId_fkey" FOREIGN KEY ("reportingManagerId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
