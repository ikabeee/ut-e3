/**
 * @jest-environment node
 */
import { getPrisma } from "@shared/lib/server/prisma";

const MISSING_URL_MESSAGE =
  'Falta DATABASE_URL. Defínela en el entorno o en .env, por ejemplo DATABASE_URL="file:./dev.db".';

const initialDatabaseUrl = process.env.DATABASE_URL;

afterEach(() => {
  restoreDatabaseUrl();
});

describe("getPrisma with an invalid DATABASE_URL", () => {
  it("explains how to define DATABASE_URL when it is missing", () => {
    delete process.env.DATABASE_URL;

    expect(() => getPrisma()).toThrow(MISSING_URL_MESSAGE);
  });

  it("treats a blank DATABASE_URL as missing", () => {
    process.env.DATABASE_URL = "   ";

    expect(() => getPrisma()).toThrow(MISSING_URL_MESSAGE);
  });

  it("rejects a DATABASE_URL that is not a SQLite file", () => {
    process.env.DATABASE_URL = "postgresql://localhost:5432/ut-e3";

    expect(() => getPrisma()).toThrow(
      'DATABASE_URL debe ser la ruta de un archivo SQLite que empiece con "file:", por ejemplo DATABASE_URL="file:./dev.db". Valor recibido: "postgresql://localhost:5432/ut-e3".',
    );
  });
});

// Assigning undefined to process.env stores the string "undefined", so an unset variable is deleted instead.
function restoreDatabaseUrl() {
  if (initialDatabaseUrl === undefined) {
    delete process.env.DATABASE_URL;
  } else {
    process.env.DATABASE_URL = initialDatabaseUrl;
  }
}
