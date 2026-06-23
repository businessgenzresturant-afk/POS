/*
  Warnings:

  - A unique constraint covering the columns `[kdsDisplayToken]` on the table `Restaurant` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "kdsDisplayToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Restaurant_kdsDisplayToken_key" ON "Restaurant"("kdsDisplayToken");
