-- CreateTable
CREATE TABLE "kof_tournament" (
    "id" INTEGER NOT NULL PRIMARY KEY,
    "state" JSONB NOT NULL,
    "version" INTEGER NOT NULL,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "kof_tournament_singleton_check" CHECK ("id" = 1),
    CONSTRAINT "kof_tournament_version_check" CHECK ("version" >= 0)
);
