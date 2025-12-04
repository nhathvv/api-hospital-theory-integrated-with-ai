/*
  Warnings:

  - You are about to alter the column `consultationFee` on the `doctors` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.
  - You are about to drop the column `name` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "doctors" ALTER COLUMN "consultationFee" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "name",
ADD COLUMN     "username" TEXT;
