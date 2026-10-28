-- CreateTable
CREATE TABLE "checkins" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "visitor_id" TEXT NOT NULL,
    "stand_id" TEXT NOT NULL,
    "checked_in_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "checkins_visitor_id_fkey" FOREIGN KEY ("visitor_id") REFERENCES "visitors" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "checkins_stand_id_fkey" FOREIGN KEY ("stand_id") REFERENCES "stands" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "raffle_tickets" (
    "number" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "visitor_id" TEXT NOT NULL,
    "milestone" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "raffle_tickets_milestone_check" CHECK ("milestone" IN (9, 18)),
    CONSTRAINT "raffle_tickets_status_check" CHECK ("status" IN ('active', 'voided')),
    CONSTRAINT "raffle_tickets_visitor_id_fkey" FOREIGN KEY ("visitor_id") REFERENCES "visitors" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "checkins_visitor_id_stand_id_key" ON "checkins"("visitor_id", "stand_id");

-- CreateIndex
CREATE UNIQUE INDEX "raffle_tickets_visitor_id_milestone_key" ON "raffle_tickets"("visitor_id", "milestone");
