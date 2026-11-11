-- A stand has one administrator and at most 3 staff accounts that are invited or active (RF-32, RF-39). Disabling an
-- account frees its place. Triggers and not partial unique indexes, like the KOF desk: Prisma cannot model those
-- indexes and the schema must keep matching. A later migration that redefines "accounts" drops these triggers, so it
-- has to create them again.
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
