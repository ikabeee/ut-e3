-- The list of accounts of the sysadmin (S8) shows when each account was created. SQLite cannot add a column with a
-- non-constant default, and rebuilding the table would drop its triggers, so the column is nullable: Prisma fills it
-- in for every new account and the accounts that already exist get the date of their first audit entry.
ALTER TABLE "accounts" ADD COLUMN "created_at" DATETIME;

UPDATE "accounts"
SET "created_at" = COALESCE(
    (SELECT MIN("audit_logs"."created_at") FROM "audit_logs"
     WHERE "audit_logs"."entity_type" = 'account' AND "audit_logs"."entity_id" = "accounts"."id"),
    CURRENT_TIMESTAMP
);
