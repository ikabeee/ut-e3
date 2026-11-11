-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "group" TEXT,
    "studio" INTEGER,
    "password_scrypt" TEXT,
    "status" TEXT NOT NULL,
    "stand_id" TEXT,
    "kof_board" INTEGER,
    "created_by_id" TEXT,
    CONSTRAINT "accounts_stand_id_fkey" FOREIGN KEY ("stand_id") REFERENCES "stands" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "accounts_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "accounts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "accounts_email_check" CHECK ("email" = lower(trim("email")) AND "email" <> ''),
    CONSTRAINT "accounts_role_check" CHECK ("role" IN ('sysadmin', 'stand_admin', 'stand_staff', 'raffle_admin', 'kof_admin', 'kof_staff', 'help_desk')),
    CONSTRAINT "accounts_status_check" CHECK ("status" IN ('invited', 'active', 'disabled')),
    CONSTRAINT "accounts_active_password_check" CHECK ("status" <> 'active' OR "password_scrypt" IS NOT NULL),
    CONSTRAINT "accounts_stand_role_check" CHECK (("role" IN ('stand_admin', 'stand_staff')) = ("stand_id" IS NOT NULL)),
    CONSTRAINT "accounts_kof_board_check" CHECK ("kof_board" IS NULL OR ("role" = 'kof_staff' AND "kof_board" BETWEEN 1 AND 4))
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "account_id" TEXT NOT NULL,
    "token_sha256" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    CONSTRAINT "sessions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actor_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "detail" JSONB NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "accounts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rate_limits" (
    "key" TEXT NOT NULL,
    "window_start" DATETIME NOT NULL,
    "count" INTEGER NOT NULL,

    PRIMARY KEY ("key", "window_start"),
    CONSTRAINT "rate_limits_count_check" CHECK ("count" > 0)
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_email_key" ON "accounts"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_sha256_key" ON "sessions"("token_sha256");

-- The audit log is insert-only (RNF-11): the database itself refuses to rewrite or remove an entry.
CREATE TRIGGER "audit_logs_no_update"
BEFORE UPDATE ON "audit_logs"
BEGIN
    SELECT RAISE(ABORT, 'audit_logs_no_update: la bitácora solo admite inserciones');
END;

CREATE TRIGGER "audit_logs_no_delete"
BEFORE DELETE ON "audit_logs"
BEGIN
    SELECT RAISE(ABORT, 'audit_logs_no_delete: la bitácora solo admite inserciones');
END;
