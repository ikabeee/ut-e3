-- A sponsor may come without a phone (Algorix Insights and Mermelada gave none): an empty phone is allowed, and a phone
-- that is set stays in E.164. SQLite cannot change a CHECK in place, so the table is redefined; it has no indexes or
-- triggers to carry over.
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_sponsors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "logo_path" TEXT NOT NULL,
    "website_url" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "services" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    CONSTRAINT "sponsors_phone_check" CHECK ("phone" = '' OR "phone" GLOB '+[0-9]*')
);
INSERT INTO "new_sponsors" ("id", "name", "logo_path", "website_url", "phone", "services", "position")
SELECT "id", "name", "logo_path", "website_url", "phone", "services", "position" FROM "sponsors";
DROP TABLE "sponsors";
ALTER TABLE "new_sponsors" RENAME TO "sponsors";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
