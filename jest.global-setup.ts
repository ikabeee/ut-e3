import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { applyMigrations } from "./src/shared/__tests__/lib/server/test-migrations";

// Migrates once; createTestDatabase copies this file (the workers inherit the variable).
export default function createTemplateDatabase() {
  const directory = mkdtempSync(path.join(tmpdir(), "ut-e3-template-db-"));
  const file = path.join(directory, "template.db");

  applyMigrations(file);
  process.env.JEST_TEMPLATE_DATABASE = file;
}
