-- AlterTable
ALTER TABLE "Bill" ADD COLUMN     "serviceChargeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "serviceChargeApplied" BOOLEAN NOT NULL DEFAULT false;
