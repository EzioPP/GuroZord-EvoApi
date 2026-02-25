/*
  Warnings:

  - A unique constraint covering the columns `[whatsapp_lid]` on the table `members` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "members" ADD COLUMN     "whatsapp_lid" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "members_whatsapp_lid_key" ON "members"("whatsapp_lid");
