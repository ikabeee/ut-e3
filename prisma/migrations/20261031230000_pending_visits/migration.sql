-- CreateTable
CREATE TABLE "pending_visits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "visitor_id" TEXT NOT NULL,
    "stand_id" TEXT NOT NULL,
    "requested_by_id" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "answered_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pending_visits_visitor_id_fkey" FOREIGN KEY ("visitor_id") REFERENCES "visitors" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "pending_visits_stand_id_fkey" FOREIGN KEY ("stand_id") REFERENCES "stands" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "pending_visits_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "pending_visits_visitor_id_key" ON "pending_visits"("visitor_id");
