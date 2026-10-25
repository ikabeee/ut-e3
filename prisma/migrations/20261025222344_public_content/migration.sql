-- CreateTable
CREATE TABLE "event_settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "event_starts_at" DATETIME NOT NULL,
    "event_ends_at" DATETIME NOT NULL,
    "registration_opens_at" DATETIME NOT NULL,
    "kof_registration_opens_at" DATETIME NOT NULL,
    "kof_check_in_starts_at" DATETIME NOT NULL,
    "kof_check_in_ends_at" DATETIME NOT NULL,
    "kof_onsite_signup_starts_at" DATETIME NOT NULL,
    "kof_onsite_signup_ends_at" DATETIME NOT NULL,
    "kof_bracket_generates_at" DATETIME NOT NULL,
    "marketplace_closes_at" DATETIME NOT NULL,
    "marketplace_form_url" TEXT,
    "itch_opens_at" DATETIME NOT NULL,
    "check_in_cutoff_at" DATETIME NOT NULL,
    "raffle_starts_at" DATETIME NOT NULL,
    "raffle_closed_at" DATETIME,
    "bracket_generated_at" DATETIME,
    "public_bracket_enabled" BOOLEAN NOT NULL,
    "fraud_top_score_count" INTEGER NOT NULL DEFAULT 12,
    "fraud_window_minutes" INTEGER NOT NULL DEFAULT 10,
    "fraud_single_visit_max" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "event_settings_singleton_check" CHECK ("id" = 1),
    CONSTRAINT "event_settings_event_window_check" CHECK (julianday("event_starts_at") < julianday("event_ends_at")),
    CONSTRAINT "event_settings_kof_check_in_window_check" CHECK (julianday("kof_check_in_starts_at") < julianday("kof_check_in_ends_at")),
    CONSTRAINT "event_settings_kof_onsite_signup_window_check" CHECK (julianday("kof_onsite_signup_starts_at") < julianday("kof_onsite_signup_ends_at")),
    CONSTRAINT "event_settings_check_in_cutoff_check" CHECK (julianday("check_in_cutoff_at") < julianday("raffle_starts_at")),
    CONSTRAINT "event_settings_fraud_top_score_count_check" CHECK ("fraud_top_score_count" > 0),
    CONSTRAINT "event_settings_fraud_window_minutes_check" CHECK ("fraud_window_minutes" > 0),
    CONSTRAINT "event_settings_fraud_single_visit_max_check" CHECK ("fraud_single_visit_max" > 0)
);

-- CreateTable
CREATE TABLE "schedule_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "starts_at" DATETIME NOT NULL,
    "ends_at" DATETIME NOT NULL,
    "zone" TEXT,
    CONSTRAINT "schedule_items_time_range_check" CHECK (julianday("ends_at") >= julianday("starts_at"))
);

-- CreateTable
CREATE TABLE "stands" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "zone" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "studio" INTEGER NOT NULL,
    "group_code" TEXT NOT NULL,
    CONSTRAINT "stands_zone_check" CHECK ("zone" IN ('A', 'B', 'C', 'D', 'T')),
    CONSTRAINT "stands_number_check" CHECK ("number" > 0)
);

-- CreateTable
CREATE TABLE "genres" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "games" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stand_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "synopsis" TEXT NOT NULL,
    "genre_id" TEXT NOT NULL,
    "itch_url" TEXT,
    CONSTRAINT "games_stand_id_fkey" FOREIGN KEY ("stand_id") REFERENCES "stands" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "games_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "genres" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "games_itch_url_check" CHECK ("itch_url" LIKE 'https://%')
);

-- CreateTable
CREATE TABLE "game_images" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "game_id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "is_cover" BOOLEAN NOT NULL,
    CONSTRAINT "game_images_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "game_images_position_check" CHECK ("position" BETWEEN 1 AND 5)
);

-- CreateTable
CREATE TABLE "sponsors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "logo_path" TEXT NOT NULL,
    "website_url" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "services" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    CONSTRAINT "sponsors_phone_check" CHECK ("phone" GLOB '+[0-9]*')
);

-- CreateIndex
CREATE UNIQUE INDEX "stands_zone_number_key" ON "stands"("zone", "number");

-- CreateIndex
CREATE UNIQUE INDEX "genres_name_key" ON "genres"("name");

-- CreateIndex
CREATE UNIQUE INDEX "genres_slug_key" ON "genres"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "games_stand_id_key" ON "games"("stand_id");

-- CreateIndex
CREATE UNIQUE INDEX "games_slug_key" ON "games"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "game_images_game_id_position_key" ON "game_images"("game_id", "position");

-- CreateIndex (hand-written): one cover per game.
CREATE UNIQUE INDEX "game_images_one_cover_per_game_key" ON "game_images"("game_id") WHERE "is_cover" = 1;

-- CreateTrigger (hand-written): the event has at most 18 stands.
CREATE TRIGGER "stands_limit_check"
BEFORE INSERT ON "stands"
WHEN (SELECT COUNT(*) FROM "stands") >= 18
BEGIN
    SELECT RAISE(ABORT, 'stands_limit_check: el evento admite como máximo 18 stands');
END;
