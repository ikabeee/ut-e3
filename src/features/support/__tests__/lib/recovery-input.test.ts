import { normalizeFullName, parseRecoveryInput } from "@features/support/lib/recovery-input";
import { SUPPORT_COPY } from "@features/support/lib/support-copy";

const ERRORS = SUPPORT_COPY.recovery.errors;

describe("parseRecoveryInput", () => {
  it("trims both fields", () => {
    expect(parseRecoveryInput(createForm("  Ana Pérez ", " Neo_01 "))).toEqual({
      ok: true,
      value: { fullName: "Ana Pérez", gamertag: "Neo_01" },
    });
  });

  it("asks for the full name", () => {
    expect(parseRecoveryInput(createForm("  ", "Neo_01"))).toEqual({ ok: false, message: ERRORS.fullNameRequired });
  });

  it("asks for the gamertag", () => {
    expect(parseRecoveryInput(createForm("Ana Pérez", ""))).toEqual({ ok: false, message: ERRORS.gamertagRequired });
  });

  it("refuses values far longer than a registration allows", () => {
    expect(parseRecoveryInput(createForm("a".repeat(121), "Neo_01"))).toEqual({
      ok: false,
      message: ERRORS.fieldTooLong,
    });
    expect(parseRecoveryInput(createForm("Ana Pérez", "n".repeat(41)))).toEqual({
      ok: false,
      message: ERRORS.fieldTooLong,
    });
  });

  it("treats a field that arrives as a file as empty", () => {
    const form = createForm("Ana Pérez", "Neo_01");

    form.set("gamertag", new File(["x"], "x.txt"));

    expect(parseRecoveryInput(form)).toEqual({ ok: false, message: ERRORS.gamertagRequired });
  });
});

describe("normalizeFullName", () => {
  it("ignores case and repeated spaces but not accents", () => {
    expect(normalizeFullName("  ANA   Pérez ")).toBe(normalizeFullName("ana pérez"));
    expect(normalizeFullName("Ana Perez")).not.toBe(normalizeFullName("Ana Pérez"));
  });

  it("treats composed and decomposed accents as the same name", () => {
    expect(normalizeFullName("Ana Pérez")).toBe(normalizeFullName("Ana Pérez"));
  });
});

function createForm(fullName: string, gamertag: string): FormData {
  const form = new FormData();

  form.set("fullName", fullName);
  form.set("gamertag", gamertag);

  return form;
}
