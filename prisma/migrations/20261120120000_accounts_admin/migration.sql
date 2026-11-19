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

-- Whoever signs in as sysadmin is the only one who can undo a locked-out system, so the database keeps at least one
-- active sysadmin. The application checks first for a friendly answer, but two sysadmins disabling each other at the
-- same time both pass that check; SQLite runs the writes one at a time, so only here is the second one stopped.
CREATE TRIGGER "accounts_keep_one_active_sysadmin_on_update"
BEFORE UPDATE OF "status", "role" ON "accounts"
WHEN OLD."role" = 'sysadmin' AND OLD."status" = 'active'
    AND (NEW."role" <> 'sysadmin' OR NEW."status" <> 'active')
    AND NOT EXISTS (
        SELECT 1 FROM "accounts"
        WHERE "role" = 'sysadmin' AND "status" = 'active' AND "id" <> OLD."id"
    )
BEGIN
    SELECT RAISE(ABORT, 'last_sysadmin');
END;

CREATE TRIGGER "accounts_keep_one_active_sysadmin_on_delete"
BEFORE DELETE ON "accounts"
WHEN OLD."role" = 'sysadmin' AND OLD."status" = 'active'
    AND NOT EXISTS (
        SELECT 1 FROM "accounts"
        WHERE "role" = 'sysadmin' AND "status" = 'active' AND "id" <> OLD."id"
    )
BEGIN
    SELECT RAISE(ABORT, 'last_sysadmin');
END;
