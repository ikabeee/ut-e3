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
    CONSTRAINT "accounts_stand_id_fkey" FOREIGN KEY ("stand_id") REFERENCES "stands" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "accounts_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "accounts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "accounts_email_check" CHECK ("email" = lower(trim("email")) AND "email" <> ''),
    CONSTRAINT "accounts_role_check" CHECK ("role" IN ('sysadmin', 'stand_admin', 'stand_staff', 'raffle_admin', 'kof_admin', 'kof_staff', 'help_desk')),
    CONSTRAINT "accounts_status_check" CHECK ("status" IN ('invited', 'active', 'disabled')),
    CONSTRAINT "accounts_active_password_check" CHECK ("status" <> 'active' OR "password_scrypt" IS NOT NULL),
    CONSTRAINT "accounts_stand_role_check" CHECK (("role" IN ('stand_admin', 'stand_staff')) = ("stand_id" IS NOT NULL)),
    CONSTRAINT "accounts_kof_desk_check" CHECK ("kof_desk" IS NULL OR ("role" = 'kof_staff' AND "kof_desk" BETWEEN 1 AND 2))
);
-- A board number 1 or 2 belongs to desk 1 and 3 or 4 to desk 2; any other value was already rejected by the old CHECK.
INSERT INTO "new_accounts" ("id", "email", "name", "role", "group", "studio", "password_scrypt", "status", "stand_id", "kof_desk", "created_by_id")
SELECT "id", "email", "name", "role", "group", "studio", "password_scrypt", "status", "stand_id",
       CASE WHEN "kof_board" IS NULL THEN NULL WHEN "kof_board" <= 2 THEN 1 ELSE 2 END,
       "created_by_id"
FROM "accounts";
DROP TABLE "accounts";
ALTER TABLE "new_accounts" RENAME TO "accounts";
CREATE UNIQUE INDEX "accounts_email_key" ON "accounts"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
