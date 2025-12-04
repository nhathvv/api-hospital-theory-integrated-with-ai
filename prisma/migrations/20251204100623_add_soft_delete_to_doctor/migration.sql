-- AlterTable
ALTER TABLE "doctors" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "doctors_deletedAt_idx" ON "doctors"("deletedAt");
