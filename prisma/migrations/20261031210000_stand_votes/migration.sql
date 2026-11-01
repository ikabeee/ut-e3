-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_checkins" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "visitor_id" TEXT NOT NULL,
    "stand_id" TEXT NOT NULL,
    "checked_in_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scanned_by_id" TEXT,
    CONSTRAINT "checkins_visitor_id_fkey" FOREIGN KEY ("visitor_id") REFERENCES "visitors" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "checkins_stand_id_fkey" FOREIGN KEY ("stand_id") REFERENCES "stands" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "checkins_scanned_by_id_fkey" FOREIGN KEY ("scanned_by_id") REFERENCES "accounts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_checkins" ("checked_in_at", "id", "stand_id", "visitor_id") SELECT "checked_in_at", "id", "stand_id", "visitor_id" FROM "checkins";
DROP TABLE "checkins";
ALTER TABLE "new_checkins" RENAME TO "checkins";
CREATE UNIQUE INDEX "checkins_visitor_id_stand_id_key" ON "checkins"("visitor_id", "stand_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateTable
CREATE TABLE "votes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "check_in_id" TEXT NOT NULL,
    "visitor_id" TEXT NOT NULL,
    "stand_id" TEXT NOT NULL,
    "game_rating" INTEGER NOT NULL,
    "stand_rating" INTEGER NOT NULL,
    "art_rating" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "votes_game_rating_check" CHECK ("game_rating" BETWEEN 1 AND 5),
    CONSTRAINT "votes_stand_rating_check" CHECK ("stand_rating" BETWEEN 1 AND 5),
    CONSTRAINT "votes_art_rating_check" CHECK ("art_rating" BETWEEN 1 AND 5),
    CONSTRAINT "votes_check_in_id_fkey" FOREIGN KEY ("check_in_id") REFERENCES "checkins" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "votes_visitor_id_fkey" FOREIGN KEY ("visitor_id") REFERENCES "visitors" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "votes_stand_id_fkey" FOREIGN KEY ("stand_id") REFERENCES "stands" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "votes_check_in_id_key" ON "votes"("check_in_id");

-- CreateIndex
CREATE UNIQUE INDEX "votes_visitor_id_stand_id_key" ON "votes"("visitor_id", "stand_id");
