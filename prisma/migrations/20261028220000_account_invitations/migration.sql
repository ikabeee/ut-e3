-- CreateTable
CREATE TABLE "account_invitations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "account_id" TEXT NOT NULL,
    "token_sha256" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "used_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "account_invitations_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "account_invitations_token_sha256_key" ON "account_invitations"("token_sha256");

-- A KOF desk has at most one staff member that is invited or active; disabling one frees the desk (UT-AC-14).
-- Triggers and not a partial unique index: Prisma cannot model that index, and the schema must keep matching.
-- A later migration that redefines "accounts" drops these triggers, so it has to create them again.
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
