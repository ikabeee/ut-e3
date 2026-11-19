-- A stand administrator can also work as the help desk, the KOF administrator, the raffle administrator or the
-- sysadmin (S1, S2). The second role lives in the same account, so it is one email and one sign-in. Only the stand
-- administrator has one, and "role" keeps meaning the primary role: the stand CHECK, the triggers of the stands and of
-- the KOF desks and the home page of the account still read it.
--
-- The column is added with ALTER TABLE instead of rebuilding the table: a rebuild would drop every trigger of
-- "accounts" (desks, stands and the last sysadmin) and every account already there simply gets NULL. SQLite tests the
-- CHECK of an added column against the rows that exist, and they all pass because they are all NULL.
ALTER TABLE "accounts" ADD COLUMN "secondary_role" TEXT
    CONSTRAINT "accounts_secondary_role_check" CHECK (
        "secondary_role" IS NULL
        OR ("role" = 'stand_admin' AND "secondary_role" IN ('help_desk', 'kof_admin', 'raffle_admin', 'sysadmin'))
    );

-- An active account with the secondary role sysadmin is a sysadmin too, so it counts for the rule that the database
-- keeps at least one active sysadmin, and losing the role (or the account) counts as removing one. A trigger cannot be
-- altered: the two of "accounts_admin" are dropped and created again with the same name and messages.
DROP TRIGGER "accounts_keep_one_active_sysadmin_on_update";

DROP TRIGGER "accounts_keep_one_active_sysadmin_on_delete";

CREATE TRIGGER "accounts_keep_one_active_sysadmin_on_update"
BEFORE UPDATE OF "status", "role", "secondary_role" ON "accounts"
WHEN (OLD."role" = 'sysadmin' OR OLD."secondary_role" IS 'sysadmin') AND OLD."status" = 'active'
    AND NOT (NEW."status" = 'active' AND (NEW."role" = 'sysadmin' OR NEW."secondary_role" IS 'sysadmin'))
    AND NOT EXISTS (
        SELECT 1 FROM "accounts"
        WHERE ("role" = 'sysadmin' OR "secondary_role" IS 'sysadmin') AND "status" = 'active' AND "id" <> OLD."id"
    )
BEGIN
    SELECT RAISE(ABORT, 'last_sysadmin');
END;

CREATE TRIGGER "accounts_keep_one_active_sysadmin_on_delete"
BEFORE DELETE ON "accounts"
WHEN (OLD."role" = 'sysadmin' OR OLD."secondary_role" IS 'sysadmin') AND OLD."status" = 'active'
    AND NOT EXISTS (
        SELECT 1 FROM "accounts"
        WHERE ("role" = 'sysadmin' OR "secondary_role" IS 'sysadmin') AND "status" = 'active' AND "id" <> OLD."id"
    )
BEGIN
    SELECT RAISE(ABORT, 'last_sysadmin');
END;
