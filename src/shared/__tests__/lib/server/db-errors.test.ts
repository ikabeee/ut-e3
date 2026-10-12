import { describeConstraintViolation, getConstraintViolation } from "@shared/lib/server/db-errors";

/** Forma en que Prisma 8 lanza los errores de PostgreSQL (`SqlQueryError`). */
function sqlError(sqlState: string, constraint: string) {
  return Object.assign(new Error("query failed"), { name: "SqlQueryError", kind: "constraint", sqlState, constraint });
}

describe("getConstraintViolation", () => {
  it("reads the violated constraint from a Prisma error", () => {
    expect(getConstraintViolation(sqlError("23505", "genre_slug_key"))).toEqual({
      kind: "unique",
      constraint: "genre_slug_key",
    });
  });

  it("also reads the pg error in the cause chain", () => {
    const error = new Error("wrapped", { cause: { code: "23503", constraint: "check_in_game_id_fkey" } });

    expect(getConstraintViolation(error)).toEqual({ kind: "foreign-key", constraint: "check_in_game_id_fkey" });
  });

  it("ignores other errors", () => {
    expect(getConstraintViolation(new Error("connection refused"))).toBeNull();
    expect(getConstraintViolation("boom")).toBeNull();
  });
});

describe("describeConstraintViolation", () => {
  const messages = { game_slug_format: "Slug inválido.", genre_slug_key: "Ese slug ya existe." };

  it("matches the constraint name by prefix (CHECK names carry a hash)", () => {
    expect(describeConstraintViolation({ kind: "check", constraint: "game_slug_format_8d1e2f3a" }, messages)).toBe(
      "Slug inválido.",
    );
  });

  it("falls back to a generic message per kind", () => {
    expect(describeConstraintViolation({ kind: "unique", constraint: "team_name_key" }, messages)).toBe(
      "Ya existe un registro con esos datos.",
    );
    expect(describeConstraintViolation({ kind: "foreign-key", constraint: "x_fkey" }, messages)).toBe(
      "No se puede completar porque hay registros relacionados.",
    );
  });
});
