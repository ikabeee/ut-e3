-- Raffle (M9, RF-49 to RF-56). A drawn visitor leaves the raffle with all of its tickets (RF-52, RN-05), so the tickets
-- get the `drawn` status of the ER model. SQLite cannot change a CHECK in place, so the table is redefined; the ticket
-- numbers are kept as they are and AUTOINCREMENT goes on from the highest one.
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_raffle_tickets" (
    "number" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "visitor_id" TEXT NOT NULL,
    "milestone" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "raffle_tickets_milestone_check" CHECK ("milestone" IN (9, 18)),
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

-- CreateTable
CREATE TABLE "raffle_draws" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticket_number" INTEGER NOT NULL,
    "request_id" TEXT NOT NULL,
    "drawn_by_id" TEXT NOT NULL,
    "outcome" TEXT NOT NULL DEFAULT 'pending',
    "drawn_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decided_at" DATETIME,
    "prize_name" TEXT,
    "prize_by_id" TEXT,
    CONSTRAINT "raffle_draws_ticket_number_fkey" FOREIGN KEY ("ticket_number") REFERENCES "raffle_tickets" ("number") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "raffle_draws_drawn_by_id_fkey" FOREIGN KEY ("drawn_by_id") REFERENCES "accounts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "raffle_draws_prize_by_id_fkey" FOREIGN KEY ("prize_by_id") REFERENCES "accounts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "raffle_draws_outcome_check" CHECK ("outcome" IN ('pending', 'winner', 'discarded')),
    -- A decided draw has its hour, and a pending one does not.
    CONSTRAINT "raffle_draws_decided_at_check" CHECK (("outcome" = 'pending') = ("decided_at" IS NULL)),
    -- Only a winner gets a prize (UT-RA-08), and a prize always names who registered it (RF-55).
    CONSTRAINT "raffle_draws_prize_winner_check" CHECK ("prize_name" IS NULL OR "outcome" = 'winner'),
    CONSTRAINT "raffle_draws_prize_by_check" CHECK (("prize_name" IS NULL) = ("prize_by_id" IS NULL)),
    CONSTRAINT "raffle_draws_prize_name_check" CHECK ("prize_name" IS NULL OR length(trim("prize_name")) BETWEEN 1 AND 80)
);

-- CreateIndex
CREATE UNIQUE INDEX "raffle_draws_ticket_number_key" ON "raffle_draws"("ticket_number");

-- CreateIndex
CREATE UNIQUE INDEX "raffle_draws_request_id_key" ON "raffle_draws"("request_id");

-- One draw without a decision at a time: nobody spins again until "Ganador" or "Descartado" (RF-51, UT-RA-03).
CREATE UNIQUE INDEX "raffle_draws_single_pending_key" ON "raffle_draws"("outcome") WHERE "outcome" = 'pending';

-- A draw stays in the record of the raffle (RN-06): it is never removed.
CREATE TRIGGER "raffle_draws_no_delete"
BEFORE DELETE ON "raffle_draws"
BEGIN
    SELECT RAISE(ABORT, 'raffle_draws_no_delete: los giros de la rifa no se borran');
END;

-- Who came out, who spun and when never change; the decision is taken once, and so is the prize.
CREATE TRIGGER "raffle_draws_fixed_draw"
BEFORE UPDATE OF "ticket_number", "request_id", "drawn_by_id", "drawn_at" ON "raffle_draws"
BEGIN
    SELECT RAISE(ABORT, 'raffle_draws_fixed_draw: el boleto sorteado no cambia');
END;

CREATE TRIGGER "raffle_draws_final_outcome"
BEFORE UPDATE OF "outcome", "decided_at" ON "raffle_draws"
WHEN OLD."outcome" <> 'pending'
BEGIN
    SELECT RAISE(ABORT, 'raffle_draws_final_outcome: la decisión del giro ya se tomó');
END;

CREATE TRIGGER "raffle_draws_final_prize"
BEFORE UPDATE OF "prize_name", "prize_by_id" ON "raffle_draws"
WHEN OLD."prize_name" IS NOT NULL
BEGIN
    SELECT RAISE(ABORT, 'raffle_draws_final_prize: el premio ya se registró');
END;
