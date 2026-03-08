-- CreateTable
CREATE TABLE "message_stats" (
    "id" SERIAL NOT NULL,
    "membership_id" INTEGER NOT NULL,
    "period_type" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "message_stats_period_type_period_start_idx" ON "message_stats"("period_type", "period_start");

-- CreateIndex
CREATE UNIQUE INDEX "message_stats_membership_id_period_type_period_start_key" ON "message_stats"("membership_id", "period_type", "period_start");

-- AddForeignKey
ALTER TABLE "message_stats" ADD CONSTRAINT "message_stats_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
