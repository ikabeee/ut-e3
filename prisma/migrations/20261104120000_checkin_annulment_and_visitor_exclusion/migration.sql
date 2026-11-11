-- AlterTable (the CHECK is hand-written): an exclusion carries its reason, and a reason without a date is not one (RF-46).
ALTER TABLE "visitors" ADD COLUMN "excluded_at" DATETIME;
ALTER TABLE "visitors" ADD COLUMN "excluded_reason" TEXT
    CONSTRAINT "visitors_exclusion_check" CHECK (
        ("excluded_at" IS NULL AND "excluded_reason" IS NULL)
        OR ("excluded_at" IS NOT NULL AND "excluded_reason" IS NOT NULL AND length(trim("excluded_reason")) > 0)
    );

-- RedefineTables: adds the annulment of a check-in; the votes keep pointing to the same ids.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_checkins" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "visitor_id" TEXT NOT NULL,
    "stand_id" TEXT NOT NULL,
    "checked_in_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scanned_by_id" TEXT,
    "annulled_at" DATETIME,
    "annulled_reason" TEXT,
    "annulled_by_id" TEXT,
    CONSTRAINT "checkins_visitor_id_fkey" FOREIGN KEY ("visitor_id") REFERENCES "visitors" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "checkins_stand_id_fkey" FOREIGN KEY ("stand_id") REFERENCES "stands" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "checkins_scanned_by_id_fkey" FOREIGN KEY ("scanned_by_id") REFERENCES "accounts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "checkins_annulled_by_id_fkey" FOREIGN KEY ("annulled_by_id") REFERENCES "accounts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    -- Hand-written: an annulment is complete (date, reason and who) or there is none (RF-46, UT-AD-04).
    CONSTRAINT "checkins_annulment_check" CHECK (
        ("annulled_at" IS NULL AND "annulled_reason" IS NULL AND "annulled_by_id" IS NULL)
        OR (
            "annulled_at" IS NOT NULL AND "annulled_reason" IS NOT NULL AND "annulled_by_id" IS NOT NULL
            AND length(trim("annulled_reason")) > 0
        )
    )
);
INSERT INTO "new_checkins" ("checked_in_at", "id", "scanned_by_id", "stand_id", "visitor_id") SELECT "checked_in_at", "id", "scanned_by_id", "stand_id", "visitor_id" FROM "checkins";
DROP TABLE "checkins";
ALTER TABLE "new_checkins" RENAME TO "checkins";
CREATE UNIQUE INDEX "checkins_visitor_id_stand_id_key" ON "checkins"("visitor_id", "stand_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
