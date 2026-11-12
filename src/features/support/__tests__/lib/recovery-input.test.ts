import { normalizeFullName, parseRecoveryTarget, parseSearchInput } from "@features/support/lib/recovery-input";
import { SUPPORT_COPY } from "@features/support/lib/support-copy";

const ERRORS = SUPPORT_COPY.recovery.errors;

describe("parseSearchInput", () => {
  it("trims the query and collapses repeated spaces", () => {
    expect(parseSearchInput(createForm({ query: "  Ana   Pérez " }))).toEqual({ ok: true, value: "Ana Pérez" });
  });

  it("accepts an email, a gamertag or a name without telling them apart", () => {
    for (const query of ["ana@gmail.com", "Neo_01", "Ana Pérez"]) {
      expect(parseSearchInput(createForm({ query }))).toEqual({ ok: true, value: query });
    }
  });

  it("asks for something to search", () => {
    expect(parseSearchInput(createForm({ query: "  " }))).toEqual({ ok: false, message: ERRORS.queryRequired });
  });

  it("refuses values far longer than a registration allows", () => {
    expect(parseSearchInput(createForm({ query: "a".repeat(121) }))).toEqual({
      ok: false,
      message: ERRORS.fieldTooLong,
    });
  });

  it("treats a field that arrives as a file as empty", () => {
    const form = createForm({});

    form.set("query", new File(["x"], "x.txt"));

    expect(parseSearchInput(form)).toEqual({ ok: false, message: ERRORS.queryRequired });
  });
});

describe("parseRecoveryTarget", () => {
  it("takes the id of the chosen passport", () => {
    expect(parseRecoveryTarget(createForm({ visitorId: " abc-123 " }))).toEqual({ ok: true, value: "abc-123" });
  });

  it("asks to choose one when it is missing or absurdly long", () => {
    expect(parseRecoveryTarget(createForm({}))).toEqual({ ok: false, message: ERRORS.targetRequired });
    expect(parseRecoveryTarget(createForm({ visitorId: "x".repeat(65) }))).toEqual({
      ok: false,
      message: ERRORS.targetRequired,
    });
  });
});

describe("normalizeFullName", () => {
  it("ignores case and repeated spaces but not accents", () => {
    expect(normalizeFullName("  ANA   Pérez ")).toBe(normalizeFullName("ana pérez"));
    expect(normalizeFullName("Ana Perez")).not.toBe(normalizeFullName("Ana Pérez"));
  });

  it("treats composed and decomposed accents as the same name", () => {
    expect(normalizeFullName("Ana Pérez")).toBe(normalizeFullName("Ana Pérez"));
  });
});

function createForm(fields: Record<string, string>): FormData {
  const form = new FormData();

  for (const [name, value] of Object.entries(fields)) form.set(name, value);

  return form;
}
