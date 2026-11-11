-- A sponsor may give a contact email. It is optional: NULL means none, and the existing rows keep their data.
-- AlterTable
ALTER TABLE "sponsors" ADD COLUMN "email" TEXT;
