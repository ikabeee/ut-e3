import { parseRegistrationInput } from "@features/visitors/lib/registration-input";

function createRegistrationFormData(fields: Record<string, string>): FormData {
  const form = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    form.append(key, value);
  }

  return form;
}

describe("parseRegistrationInput", () => {
  it("normalizes and accepts valid registration input", () => {
    const form = createRegistrationFormData({
      fullName: "  Thomas Anderson  ",
      gamertag: "  Neo_123  ",
      email: "  NEO@Matrix.ORG  ",
    });

    const parsed = parseRegistrationInput(form);

    expect(parsed).toEqual({
      ok: true,
      value: {
        fullName: "Thomas Anderson",
        gamertag: "Neo_123",
        email: "neo@matrix.org",
      },
    });
  });

  it("accepts boundary lengths for fullName (3 and 80 chars) and gamertag (3 and 20 chars)", () => {
    const minForm = createRegistrationFormData({
      fullName: "Neo",
      gamertag: "neo",
      email: "neo@ut.mx",
    });

    const maxForm = createRegistrationFormData({
      fullName: "A".repeat(80),
      gamertag: "G".repeat(20),
      email: "gamer@ut.mx",
    });

    expect(parseRegistrationInput(minForm)).toMatchObject({ ok: true });
    expect(parseRegistrationInput(maxForm)).toMatchObject({ ok: true });
  });

  it("reports an error when fullName is too short, too long, or empty", () => {
    const emptyForm = createRegistrationFormData({
      fullName: "   ",
      gamertag: "Neo123",
      email: "neo@ut.mx",
    });

    const shortForm = createRegistrationFormData({
      fullName: "No",
      gamertag: "Neo123",
      email: "neo@ut.mx",
    });

    const longForm = createRegistrationFormData({
      fullName: "A".repeat(81),
      gamertag: "Neo123",
      email: "neo@ut.mx",
    });

    expect(parseRegistrationInput(emptyForm)).toEqual({
      ok: false,
      fieldErrors: expect.objectContaining({ fullName: expect.any(String) }),
    });

    expect(parseRegistrationInput(shortForm)).toEqual({
      ok: false,
      fieldErrors: expect.objectContaining({ fullName: expect.any(String) }),
    });

    expect(parseRegistrationInput(longForm)).toEqual({
      ok: false,
      fieldErrors: expect.objectContaining({ fullName: expect.any(String) }),
    });
  });

  it("reports an error when gamertag contains invalid characters or boundary violations", () => {
    const invalidCharsForm = createRegistrationFormData({
      fullName: "Trinity",
      gamertag: "Trin ity!",
      email: "trinity@ut.mx",
    });

    const shortGamertagForm = createRegistrationFormData({
      fullName: "Trinity",
      gamertag: "Tr",
      email: "trinity@ut.mx",
    });

    const longGamertagForm = createRegistrationFormData({
      fullName: "Trinity",
      gamertag: "T".repeat(21),
      email: "trinity@ut.mx",
    });

    expect(parseRegistrationInput(invalidCharsForm)).toEqual({
      ok: false,
      fieldErrors: expect.objectContaining({ gamertag: expect.any(String) }),
    });

    expect(parseRegistrationInput(shortGamertagForm)).toEqual({
      ok: false,
      fieldErrors: expect.objectContaining({ gamertag: expect.any(String) }),
    });

    expect(parseRegistrationInput(longGamertagForm)).toEqual({
      ok: false,
      fieldErrors: expect.objectContaining({ gamertag: expect.any(String) }),
    });
  });

  it("reports an error when email is not plausible or missing", () => {
    const invalidEmails = ["", "   ", "plainaddress", "missing@domain", "@missinguser.com", "user@.com"];

    for (const invalidEmail of invalidEmails) {
      const form = createRegistrationFormData({
        fullName: "Morpheus",
        gamertag: "Morpheus",
        email: invalidEmail,
      });

      const parsed = parseRegistrationInput(form);

      expect(parsed).toEqual({
        ok: false,
        fieldErrors: expect.objectContaining({ email: expect.any(String) }),
      });
    }
  });

  it("reports multiple field errors when multiple fields are invalid", () => {
    const form = createRegistrationFormData({
      fullName: "N",
      gamertag: "N",
      email: "invalid-email",
    });

    const parsed = parseRegistrationInput(form);

    expect(parsed).toEqual({
      ok: false,
      fieldErrors: {
        fullName: expect.any(String),
        gamertag: expect.any(String),
        email: expect.any(String),
      },
    });
  });
});
