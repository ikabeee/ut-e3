-- The grid of covers asks for the card, the landscape cover and four screenshots: six images per game, in positions 1 to
-- 6 (stand administrators upload them, RF-31). The first migration allowed only 1 to 5, so the fourth screenshot could
-- not be stored. SQLite cannot change a CHECK in place, so the table is redefined; its two indexes are dropped with the
-- old table and created again, and no other table or trigger refers to game_images.
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_game_images" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "game_id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "is_cover" BOOLEAN NOT NULL,
    CONSTRAINT "game_images_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "game_images_position_check" CHECK ("position" BETWEEN 1 AND 6)
);
INSERT INTO "new_game_images" ("id", "game_id", "path", "alt", "position", "is_cover")
SELECT "id", "game_id", "path", "alt", "position", "is_cover" FROM "game_images";
DROP TABLE "game_images";
ALTER TABLE "new_game_images" RENAME TO "game_images";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "game_images_game_id_position_key" ON "game_images"("game_id", "position");

-- CreateIndex (hand-written): one cover per game.
CREATE UNIQUE INDEX "game_images_one_cover_per_game_key" ON "game_images"("game_id") WHERE "is_cover" = 1;
