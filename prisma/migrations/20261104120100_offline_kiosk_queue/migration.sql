-- Offline queue of the stand kiosk (RF-24, RF-35, RF-78, RNF-19).

-- AlterTable: when the kiosk took the PIN. A visit of the offline queue reaches the server later (RN-04).
ALTER TABLE "checkins" ADD COLUMN "scanned_at" DATETIME;

-- AlterTable (hand-written): a plain ADD COLUMN instead of the table redefinition Prisma generates, which would drop the
-- CHECK constraints of event_settings (*_public_content). The default is the fixed salt of the PIN filter (RNF-19).
ALTER TABLE "event_settings" ADD COLUMN "pin_filter_salt" TEXT NOT NULL DEFAULT 'ut-e3-pixel-and-code-2026';

-- CreateTable: refusals of queued visits of a known visitor, which the passport shows (RF-24).
CREATE TABLE "rejected_visits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "visitor_id" TEXT NOT NULL,
    "stand_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "scanned_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "rejected_visits_visitor_id_fkey" FOREIGN KEY ("visitor_id") REFERENCES "visitors" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "rejected_visits_stand_id_fkey" FOREIGN KEY ("stand_id") REFERENCES "stands" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "rejected_visits_visitor_id_idx" ON "rejected_visits"("visitor_id");
