import { loadEnvConfig } from "@next/env";
import { defineConfig } from "prisma/config";

loadEnvConfig(process.cwd());

// process.env instead of env(): `prisma generate` runs in CI before any database exists, and env() throws when the
// variable is missing.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // react-server makes `server-only` resolve to its empty module outside Next; tsx resolves the tsconfig aliases.
    seed: "tsx --conditions=react-server prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
