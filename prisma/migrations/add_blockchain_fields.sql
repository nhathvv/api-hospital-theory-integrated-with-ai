-- Add blockchain fields to Payment table
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "dataHash" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "blockchainTxHash" TEXT;
CREATE INDEX IF NOT EXISTS "payments_blockchainTxHash_idx" ON "payments"("blockchainTxHash");

-- Create BlockchainTransaction table
CREATE TYPE "BlockchainRecordType" AS ENUM ('PAYMENT', 'MEDICAL_RECORD', 'PRESCRIPTION', 'CREDENTIAL');
CREATE TYPE "BlockchainTxStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED');

CREATE TABLE IF NOT EXISTS "blockchain_transactions" (
    "id" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "dataHash" TEXT NOT NULL,
    "recordType" "BlockchainRecordType" NOT NULL,
    "recordId" TEXT NOT NULL,
    "blockNumber" INTEGER,
    "gasUsed" TEXT,
    "status" "BlockchainTxStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "blockchain_transactions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "blockchain_transactions_txHash_key" ON "blockchain_transactions"("txHash");
CREATE INDEX IF NOT EXISTS "blockchain_transactions_recordType_recordId_idx" ON "blockchain_transactions"("recordType", "recordId");
CREATE INDEX IF NOT EXISTS "blockchain_transactions_txHash_idx" ON "blockchain_transactions"("txHash");

