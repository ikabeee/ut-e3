-- A KOF entry gives one raffle ticket, stored with milestone 0 next to the tickets of 9 and 18 visits. SQLite cannot
-- change a CHECK in place, so the table is redefined as in *_raffle_draws: the ticket numbers are kept and
-- AUTOINCREMENT goes on from the highest one.
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_raffle_tickets" (
    "number" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "visitor_id" TEXT NOT NULL,
    "milestone" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "raffle_tickets_milestone_check" CHECK ("milestone" IN (0, 9, 18)),
    CONSTRAINT "raffle_tickets_status_check" CHECK ("status" IN ('active', 'drawn', 'voided')),
    CONSTRAINT "raffle_tickets_visitor_id_fkey" FOREIGN KEY ("visitor_id") REFERENCES "visitors" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_raffle_tickets" ("number", "visitor_id", "milestone", "status", "created_at")
SELECT "number", "visitor_id", "milestone", "status", "created_at" FROM "raffle_tickets";
DROP TABLE "raffle_tickets";
ALTER TABLE "new_raffle_tickets" RENAME TO "raffle_tickets";
CREATE UNIQUE INDEX "raffle_tickets_visitor_id_milestone_key" ON "raffle_tickets"("visitor_id", "milestone");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- The players already entered get their ticket now, in the order they entered. A no-show or an excluded visitor gets
-- it voided, and a visitor already drawn gets it drawn, so it never enters the drum again (RF-52, RN-05).
INSERT INTO "raffle_tickets" ("visitor_id", "milestone", "status", "created_at")
SELECT
    e."visitor_id",
    0,
    CASE
        WHEN EXISTS (SELECT 1 FROM "raffle_tickets" t WHERE t."visitor_id" = e."visitor_id" AND t."status" = 'drawn') THEN 'drawn'
        WHEN e."status" = 'no_show' OR v."excluded_at" IS NOT NULL THEN 'voided'
        ELSE 'active'
    END,
    e."created_at"
FROM "tournament_entries" e
JOIN "visitors" v ON v."id" = e."visitor_id"
WHERE NOT EXISTS (SELECT 1 FROM "raffle_tickets" t WHERE t."visitor_id" = e."visitor_id" AND t."milestone" = 0)
ORDER BY e."created_at", e."id";
