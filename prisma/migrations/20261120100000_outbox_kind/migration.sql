-- AlterTable
ALTER TABLE "email_outbox" ADD COLUMN "kind" TEXT;
ALTER TABLE "email_outbox" ADD COLUMN "reference_id" TEXT;
