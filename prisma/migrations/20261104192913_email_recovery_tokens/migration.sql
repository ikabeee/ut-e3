-- CreateTable
CREATE TABLE "recovery_tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "visitor_id" TEXT NOT NULL,
    "token_sha256" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "issued_by_id" TEXT,
    "expires_at" DATETIME NOT NULL,
    "used_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- ER: the link comes by email (RF-68) or from the help desk, which always names the agent that issued it (RF-69).
    CONSTRAINT "recovery_tokens_channel_check" CHECK ("channel" IN ('email', 'help_desk')),
    CONSTRAINT "recovery_tokens_help_desk_agent_check" CHECK ("channel" <> 'help_desk' OR "issued_by_id" IS NOT NULL),
    CONSTRAINT "recovery_tokens_visitor_id_fkey" FOREIGN KEY ("visitor_id") REFERENCES "visitors" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "recovery_tokens_issued_by_id_fkey" FOREIGN KEY ("issued_by_id") REFERENCES "accounts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "recovery_tokens_token_sha256_key" ON "recovery_tokens"("token_sha256");

-- CreateIndex
CREATE INDEX "recovery_tokens_visitor_id_idx" ON "recovery_tokens"("visitor_id");
