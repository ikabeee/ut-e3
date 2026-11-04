import { isEmailAddress, validateContactForm } from "@features/studio/lib/contact-form";

const VALID_FIELDS = {
  email: "equipo@utcancun.edu.mx",
  name: " Ana ",
  organization: "",
  message: "Queremos patrocinar un torneo.",
  consent: "on",
};

function buildForm(fields: Record<string, string>): FormData {
  const form = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    form.set(key, value);
  }

  return form;
}

describe("validateContactForm", () => {
  it("accepts a complete form and trims the values", () => {
    expect(validateContactForm(buildForm(VALID_FIELDS))).toEqual({
      ok: true,
      data: {
        email: "equipo@utcancun.edu.mx",
        name: "Ana",
        organization: "",
        message: "Queremos patrocinar un torneo.",
      },
    });
  });

  it("reports every invalid field", () => {
    const result = validateContactForm(buildForm({ email: "no-es-correo", name: "", message: "Hola" }));

    expect(result).toEqual({
      ok: false,
      errors: {
        email: "Escribe un correo válido.",
        name: "Escribe tu nombre.",
        organization: undefined,
        message: "Cuéntanos un poco más (mínimo 10 caracteres).",
        consent: "Necesitamos tu permiso para responderte.",
      },
    });
  });

  it("rejects a message that is too long", () => {
    expect(validateContactForm(buildForm({ ...VALID_FIELDS, message: "a".repeat(2001) })).ok).toBe(false);
  });
});

describe("isEmailAddress", () => {
  it.each([
    ["ana@utcancun.edu.mx", true],
    ["ana@utcancun", false],
    ["ana@.mx", false],
    ["ana@mx.", false],
    ["@utcancun.edu.mx", false],
    ["ana @utcancun.edu.mx", false],
    ["a@b@c.mx", false],
  ])("%s -> %s", (value, expected) => {
    expect(isEmailAddress(value)).toBe(expected);
  });
});
