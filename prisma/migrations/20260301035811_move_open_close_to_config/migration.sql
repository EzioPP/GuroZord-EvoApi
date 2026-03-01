/*
  Warnings:

  - You are about to drop the column `close_time` on the `groups` table. All the data in the column will be lost.
  - You are about to drop the column `is_closed` on the `groups` table. All the data in the column will be lost.
  - You are about to drop the column `open_time` on the `groups` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "groups" DROP COLUMN "close_time",
DROP COLUMN "is_closed",
DROP COLUMN "open_time";

-- CreateTable
CREATE TABLE "group_config" (
    "id" SERIAL NOT NULL,
    "group_id" INTEGER,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "language" TEXT NOT NULL DEFAULT 'pt-br',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "group_config_group_id_key_language_key" ON "group_config"("group_id", "key", "language");

-- AddForeignKey
ALTER TABLE "group_config" ADD CONSTRAINT "group_config_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
