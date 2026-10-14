import { isUuid, SLUG_PATTERN, ValidationError, validate } from "@shared/lib/validation";

function errorsOf(run: () => void) {
  try {
    run();
  } catch (error) {
    if (error instanceof ValidationError) return error.fieldErrors;
    throw error;
  }

  return {};
}

describe("validate", () => {
  it("trims texts and returns the data when every field is valid", () => {
    const data = validate({ name: "  Equipo Grava ", count: "3", leader: "on", ids: ["a", "a", "b"] }, (field) => ({
      name: field.text("name", { label: "El nombre", max: 80 }),
      count: field.integer("count", { label: "La cantidad", min: 0, max: 5 }),
      leader: field.boolean("leader"),
      ids: field.list("ids"),
    }));

    expect(data).toEqual({ name: "Equipo Grava", count: 3, leader: true, ids: ["a", "b"] });
  });

  it("collects one message per invalid field", () => {
    const errors = errorsOf(() =>
      validate({ name: "", slug: "Ruta 9", count: 9 }, (field) => ({
        name: field.text("name", { label: "El nombre", max: 80 }),
        slug: field.text("slug", {
          label: "El slug",
          max: 80,
          pattern: SLUG_PATTERN,
          patternMessage: "Slug inválido.",
        }),
        count: field.integer("count", { label: "La cantidad", min: 0, max: 5 }),
      })),
    );

    expect(errors).toEqual({
      name: "El nombre es obligatorio.",
      slug: "Slug inválido.",
      count: "La cantidad debe ser un número entero entre 0 y 5.",
    });
  });

  it("enforces the maximum length", () => {
    const errors = errorsOf(() =>
      validate({ name: "x".repeat(81) }, (field) => ({ name: field.text("name", { label: "El nombre", max: 80 }) })),
    );

    expect(errors).toEqual({ name: "El nombre: máximo 80 caracteres." });
  });

  it("turns an empty optional text into null and uses the integer fallback", () => {
    const data = validate({ url: "  " }, (field) => ({
      url: field.optionalText("url", { label: "El enlace", max: 300 }),
      order: field.integer("order", { label: "El orden", min: 0, max: 9, fallback: 0 }),
    }));

    expect(data).toEqual({ url: null, order: 0 });
  });

  it("accepts only the allowed values", () => {
    const groups = ["IDYGS101", "IDYGS102"] as const;

    const errors = errorsOf(() =>
      validate({ group: "X" }, (field) => ({ group: field.oneOf("group", groups, "el grupo") })),
    );

    expect(errors).toEqual({ group: "Elige un valor válido para el grupo." });
  });
});

describe("isUuid", () => {
  it("recognizes database ids", () => {
    expect(isUuid("5fa14e63-f73d-4e4d-9fea-bb72dd9f7ad7")).toBe(true);
    expect(isUuid("ruta-9")).toBe(false);
    expect(isUuid(undefined)).toBe(false);
  });
});
