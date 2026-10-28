-- CreateTable
CREATE TABLE "tournament_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "visitor_id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "checked_in_at" DATETIME,
    "registered_by_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tournament_entries_visitor_id_fkey" FOREIGN KEY ("visitor_id") REFERENCES "visitors" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "tournament_entries_registered_by_id_fkey" FOREIGN KEY ("registered_by_id") REFERENCES "accounts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "tournament_entries_channel_check" CHECK ("channel" IN ('pre', 'onsite')),
    CONSTRAINT "tournament_entries_status_check" CHECK ("status" IN ('registered', 'checked_in', 'no_show')),
    CONSTRAINT "tournament_entries_check_in_check" CHECK (("status" = 'checked_in') = ("checked_in_at" IS NOT NULL)),
    CONSTRAINT "tournament_entries_onsite_check" CHECK ("channel" = 'pre' OR "status" = 'checked_in')
);

-- CreateIndex
CREATE UNIQUE INDEX "tournament_entries_visitor_id_key" ON "tournament_entries"("visitor_id");

-- A no_show is final (RF-76): "No se presentó" no longer changes.
CREATE TRIGGER "tournament_entries_no_show_is_final"
BEFORE UPDATE ON "tournament_entries"
WHEN OLD."status" = 'no_show'
BEGIN
    SELECT RAISE(ABORT, 'La inscripción en No se presentó ya no cambia');
END;

-- At most 64 entries that did not miss the check-in; a no_show frees its place (RF-58, EC-05).
CREATE TRIGGER "tournament_entries_capacity"
BEFORE INSERT ON "tournament_entries"
WHEN NEW."status" <> 'no_show'
    AND (SELECT COUNT(*) FROM "tournament_entries" WHERE "status" <> 'no_show') >= 64
BEGIN
    SELECT RAISE(ABORT, 'Torneo lleno');
END;

-- At most 50 entries in the pre-registration list, to leave at least 14 places for the event day (RF-58).
CREATE TRIGGER "tournament_entries_pre_limit"
BEFORE INSERT ON "tournament_entries"
WHEN NEW."channel" = 'pre'
    AND (SELECT COUNT(*) FROM "tournament_entries" WHERE "channel" = 'pre') >= 50
BEGIN
    SELECT RAISE(ABORT, 'Lista previa llena');
END;
