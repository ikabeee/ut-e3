-- CreateTable
-- Server logs kept in the database (S4): they survive restarts. Unlike audit_logs this table is NOT insert-only: the
-- hourly retention (shared/lib/server/server-log-retention.ts) deletes the rows older than 30 days.
CREATE TABLE "server_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "level" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "details" JSONB NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "server_logs_level_check" CHECK ("level" IN ('error', 'warn', 'info')),
    CONSTRAINT "server_logs_source_check" CHECK ("source" IN ('request', 'email', 'overload', 'emergency', 'worker', 'console'))
);

-- CreateIndex
CREATE INDEX "server_logs_created_at_idx" ON "server_logs"("created_at");

-- CreateIndex
CREATE INDEX "server_logs_level_created_at_idx" ON "server_logs"("level", "created_at");
