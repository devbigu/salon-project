/*
  Warnings:

  - You are about to drop the column `managerId` on the `Staff` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Staff" DROP CONSTRAINT "Staff_managerId_fkey";

-- AlterTable
ALTER TABLE "Staff" DROP COLUMN "managerId",
ADD COLUMN     "relationshipManagerId" TEXT;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_relationshipManagerId_fkey" FOREIGN KEY ("relationshipManagerId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
