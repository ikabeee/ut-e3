-- The KOF tournament has four staff desks, one for each board (S3): the CHECK on "kof_desk" goes from 1-2 to 1-4.
-- SQLite cannot alter a CHECK, so "accounts" is rebuilt. Dropping the table also drops every trigger on it, so each one
-- is created again below with the same name, events and messages as its last definition:
--   20261028220000_account_invitations   desks: one staff member per desk
--   20261102120000_stand_accounts        stands: one administrator and at most 3 staff
--   20261121100000_account_secondary_role  the last active sysadmin, also by the secondary role
-- The rebuilt table keeps every column (including "created_at" and "secondary_role"), every CHECK (including
-- "accounts_secondary_role_check"), both foreign keys and the unique index on "email". The rows are copied as they are.

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "group" TEXT,
    "studio" INTEGER,
    "password_scrypt" TEXT,
    "status" TEXT NOT NULL,
    "stand_id" TEXT,
    "kof_desk" INTEGER,
    "created_by_id" TEXT,
    "created_at" DATETIME,
    "secondary_role" TEXT,
    CONSTRAINT "accounts_stand_id_fkey" FOREIGN KEY ("stand_id") REFERENCES "stands" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "accounts_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "accounts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "accounts_email_check" CHECK ("email" = lower(trim("email")) AND "email" <> ''),
    CONSTRAINT "accounts_role_check" CHECK ("role" IN ('sysadmin', 'stand_admin', 'stand_staff', 'raffle_admin', 'kof_admin', 'kof_staff', 'help_desk')),
    CONSTRAINT "accounts_status_check" CHECK ("status" IN ('invited', 'active', 'disabled')),
    CONSTRAINT "accounts_active_password_check" CHECK ("status" <> 'active' OR "password_scrypt" IS NOT NULL),
    CONSTRAINT "accounts_stand_role_check" CHECK (("role" IN ('stand_admin', 'stand_staff')) = ("stand_id" IS NOT NULL)),
    CONSTRAINT "accounts_kof_desk_check" CHECK ("kof_desk" IS NULL OR ("role" = 'kof_staff' AND "kof_desk" BETWEEN 1 AND 4)),
    CONSTRAINT "accounts_secondary_role_check" CHECK (
        "secondary_role" IS NULL
        OR ("role" = 'stand_admin' AND "secondary_role" IN ('help_desk', 'kof_admin', 'raffle_admin', 'sysadmin'))
    )
);
INSERT INTO "new_accounts" ("id", "email", "name", "role", "group", "studio", "password_scrypt", "status", "stand_id", "kof_desk", "created_by_id", "created_at", "secondary_role")
SELECT "id", "email", "name", "role", "group", "studio", "password_scrypt", "status", "stand_id", "kof_desk", "created_by_id", "created_at", "secondary_role"
FROM "accounts";
DROP TABLE "accounts";
ALTER TABLE "new_accounts" RENAME TO "accounts";
CREATE UNIQUE INDEX "accounts_email_key" ON "accounts"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- A KOF desk has one active (or invited) staff member at a time.
CREATE TRIGGER "accounts_kof_desk_is_unique_on_insert"
BEFORE INSERT ON "accounts"
WHEN NEW."role" = 'kof_staff' AND NEW."kof_desk" IS NOT NULL AND NEW."status" <> 'disabled'
    AND EXISTS (
        SELECT 1 FROM "accounts"
        WHERE "role" = 'kof_staff' AND "kof_desk" = NEW."kof_desk" AND "status" <> 'disabled'
    )
BEGIN
    SELECT RAISE(ABORT, 'La mesa ya tiene un staff');
END;

CREATE TRIGGER "accounts_kof_desk_is_unique_on_update"
BEFORE UPDATE OF "role", "kof_desk", "status" ON "accounts"
WHEN NEW."role" = 'kof_staff' AND NEW."kof_desk" IS NOT NULL AND NEW."status" <> 'disabled'
    AND EXISTS (
        SELECT 1 FROM "accounts"
        WHERE "role" = 'kof_staff' AND "kof_desk" = NEW."kof_desk" AND "status" <> 'disabled' AND "id" <> NEW."id"
    )
BEGIN
    SELECT RAISE(ABORT, 'La mesa ya tiene un staff');
END;

-- A stand has one administrator and at most 3 staff accounts.
CREATE TRIGGER "accounts_stand_admin_is_unique_on_insert"
BEFORE INSERT ON "accounts"
WHEN NEW."role" = 'stand_admin' AND NEW."status" <> 'disabled'
    AND EXISTS (
        SELECT 1 FROM "accounts"
        WHERE "role" = 'stand_admin' AND "stand_id" = NEW."stand_id" AND "status" <> 'disabled'
    )
BEGIN
    SELECT RAISE(ABORT, 'El stand ya tiene un administrador');
END;

CREATE TRIGGER "accounts_stand_admin_is_unique_on_update"
BEFORE UPDATE OF "role", "stand_id", "status" ON "accounts"
WHEN NEW."role" = 'stand_admin' AND NEW."status" <> 'disabled'
    AND EXISTS (
        SELECT 1 FROM "accounts"
        WHERE "role" = 'stand_admin' AND "stand_id" = NEW."stand_id" AND "status" <> 'disabled' AND "id" <> NEW."id"
    )
BEGIN
    SELECT RAISE(ABORT, 'El stand ya tiene un administrador');
END;

CREATE TRIGGER "accounts_stand_staff_limit_on_insert"
BEFORE INSERT ON "accounts"
WHEN NEW."role" = 'stand_staff' AND NEW."status" <> 'disabled'
    AND (
        SELECT COUNT(*) FROM "accounts"
        WHERE "role" = 'stand_staff' AND "stand_id" = NEW."stand_id" AND "status" <> 'disabled'
    ) >= 3
BEGIN
    SELECT RAISE(ABORT, 'El stand ya tiene 3 cuentas de staff');
END;

CREATE TRIGGER "accounts_stand_staff_limit_on_update"
BEFORE UPDATE OF "role", "stand_id", "status" ON "accounts"
WHEN NEW."role" = 'stand_staff' AND NEW."status" <> 'disabled'
    AND (
        SELECT COUNT(*) FROM "accounts"
        WHERE "role" = 'stand_staff' AND "stand_id" = NEW."stand_id" AND "status" <> 'disabled' AND "id" <> NEW."id"
    ) >= 3
BEGIN
    SELECT RAISE(ABORT, 'El stand ya tiene 3 cuentas de staff');
END;

-- The database keeps at least one active sysadmin, by the primary or by the secondary role.
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
