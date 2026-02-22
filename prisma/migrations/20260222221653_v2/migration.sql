/*
  Warnings:

  - You are about to drop the column `dt_created` on the `groups` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[whatsapp_id]` on the table `members` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "groups" DROP COLUMN "dt_created";

-- AlterTable
ALTER TABLE "members" ALTER COLUMN "name" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "members_whatsapp_id_key" ON "members"("whatsapp_id");
