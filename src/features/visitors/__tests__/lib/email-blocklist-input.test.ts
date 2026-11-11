import {
  MAX_EMAIL_LENGTH,
  MAX_EMAILS_PER_SUBMISSION,
  parseBlockedEmails,
} from "@features/visitors/lib/email-blocklist-input";

function formWith(emails: string): FormData {
  const form = new FormData();

  form.set("emails", emails);

  return form;
}

describe("parseBlockedEmails (RF-44)", () => {
  it("reads one per line or separated by commas, lower case and without repeats", () => {
    expect(parseBlockedEmails(formWith("Ana@Equipo.mx, luis@equipo.mx\nana@equipo.mx;  "))).toEqual({
      isValid: true,
      emails: ["ana@equipo.mx", "luis@equipo.mx"],
    });
  });

  it("refuses an empty submission", () => {
    expect(parseBlockedEmails(formWith(" \n , ;"))).toEqual({ isValid: false, reason: "empty" });
  });

  it("refuses more addresses than one team at once", () => {
    const many = Array.from({ length: MAX_EMAILS_PER_SUBMISSION + 1 }, (_, index) => `p${index}@equipo.mx`);

    expect(parseBlockedEmails(formWith(many.join("\n")))).toEqual({ isValid: false, reason: "tooMany" });
  });

  it("refuses an address longer than SMTP allows and cuts it in the message", () => {
    const long = `${"a".repeat(MAX_EMAIL_LENGTH)}@equipo.mx`;
    const parsed = parseBlockedEmails(formWith(long));

    expect(parsed).toMatchObject({ isValid: false, reason: "invalid" });
    expect(parsed.isValid ? "" : (parsed.invalid ?? "")).toHaveLength(61);
  });

  it("refuses an injection attempt as an invalid address", () => {
    expect(parseBlockedEmails(formWith("x@y.mx'); DROP TABLE visitors;--"))).toMatchObject({
      isValid: false,
      reason: "invalid",
    });
  });
});
