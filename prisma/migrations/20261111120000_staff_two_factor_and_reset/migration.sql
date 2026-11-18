-- Two-factor sign-in by email (login_challenges) and password reset links (password_reset_tokens). Only new tables:
-- no existing row changes.
-- CreateTable
CREATE TABLE "login_challenges" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "account_id" TEXT NOT NULL,
    "token_sha256" TEXT NOT NULL,
    "code_sha256" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expires_at" DATETIME NOT NULL,
    "used_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "login_challenges_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "login_challenges_attempts_check" CHECK ("attempts" >= 0)
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "account_id" TEXT NOT NULL,
    "token_sha256" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "used_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "password_reset_tokens_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "login_challenges_token_sha256_key" ON "login_challenges"("token_sha256");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_sha256_key" ON "password_reset_tokens"("token_sha256");
