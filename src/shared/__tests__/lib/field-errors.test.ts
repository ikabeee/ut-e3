import { joinFieldErrors } from "@shared/lib/field-errors";

describe("joinFieldErrors", () => {
  it("joins the message of every field in one line, in the order of the fields", () => {
    expect(joinFieldErrors({ title: "Escribe un título.", endsAt: ["Termina antes de empezar."] })).toBe(
      "Escribe un título. Termina antes de empezar.",
    );
  });

  it("says each message once although several fields share it", () => {
    expect(joinFieldErrors({ startsAt: "Revisa las horas.", endsAt: "Revisa las horas." })).toBe("Revisa las horas.");
  });

  it("is null when no field has an error", () => {
    expect(joinFieldErrors(undefined)).toBeNull();
    expect(joinFieldErrors(null)).toBeNull();
    expect(joinFieldErrors({ email: undefined, name: [] })).toBeNull();
  });
});
