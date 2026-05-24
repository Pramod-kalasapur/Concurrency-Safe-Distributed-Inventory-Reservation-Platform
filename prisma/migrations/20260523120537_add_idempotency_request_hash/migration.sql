-- AlterTable
ALTER TABLE "IdempotencyRequest" ADD COLUMN     "requestHash" TEXT NOT NULL DEFAULT '';
