import { getRelatedFields, parseEventSettingsInput } from "@features/event-settings/lib/event-settings-input";

// The initial values of section 1.1, as the form sends them: Cancun wall-clock times.
const VALID = {
  eventStartsAt: "2026-11-20T12:00",
  eventEndsAt: "2026-11-20T18:30",
  registrationOpensAt: "2026-11-13T00:00",
  kofRegistrationOpensAt: "2026-11-13T00:00",
  kofCheckInStartsAt: "2026-11-20T12:00",
  kofCheckInEndsAt: "2026-11-20T12:45",
  kofOnsiteSignupStartsAt: "2026-11-20T12:00",
  kofOnsiteSignupEndsAt: "2026-11-20T12:45",
  kofBracketGeneratesAt: "2026-11-20T12:55",
  marketplaceClosesAt: "2026-11-10T23:59",
  itchOpensAt: "2026-11-20T16:30",
  checkInCutoffAt: "2026-11-20T16:50",
  raffleStartsAt: "2026-11-20T18:00",
  marketplaceFormUrl: "",
  fraudTopScoreCount: "12",
  fraudWindowMinutes: "10",
  fraudSingleVisitMax: "1",
};

function formWith(changes: Partial<Record<keyof typeof VALID, string>> = {}) {
  const form = new FormData();

  for (const [name, value] of Object.entries({ ...VALID, ...changes })) form.set(name, value);

  return form;
}

describe("parseEventSettingsInput (RF-43)", () => {
  it("turns Cancun times into UTC instants and reads the thresholds", () => {
    const parsed = parseEventSettingsInput(formWith());

    expect(parsed).toMatchObject({
      isValid: true,
      settings: {
        eventStartsAt: "2026-11-20T17:00:00.000Z",
        raffleStartsAt: "2026-11-20T23:00:00.000Z",
        marketplaceFormUrl: null,
        fraudTopScoreCount: 12,
        fraudWindowMinutes: 10,
        fraudSingleVisitMax: 1,
      },
    });
  });

  it("refuses a cutoff of check-ins after the start of the raffle (UT-ES-01)", () => {
    expect(parseEventSettingsInput(formWith({ checkInCutoffAt: "2026-11-20T18:10" }))).toEqual({
      isValid: false,
      errors: { raffleStartsAt: "El corte de check-ins debe ser antes del inicio de la rifa." },
    });
  });

  it("refuses KOF windows that end before or when they start (UT-ES-04)", () => {
    const parsed = parseEventSettingsInput(
      formWith({ kofCheckInEndsAt: "2026-11-20T12:00", kofOnsiteSignupEndsAt: "2026-11-20T11:00" }),
    );

    expect(parsed.isValid).toBe(false);
    expect(parsed).toMatchObject({
      errors: { kofCheckInEndsAt: expect.any(String), kofOnsiteSignupEndsAt: expect.any(String) },
    });
  });

  it("refuses thresholds of 0, negative or with decimals (UT-AD-16)", () => {
    const parsed = parseEventSettingsInput(
      formWith({ fraudTopScoreCount: "0", fraudWindowMinutes: "-5", fraudSingleVisitMax: "1.5" }),
    );

    expect(parsed).toMatchObject({
      isValid: false,
      errors: {
        fraudTopScoreCount: expect.any(String),
        fraudWindowMinutes: expect.any(String),
        fraudSingleVisitMax: expect.any(String),
      },
    });
  });

  it("accepts only an https URL for the Marketplace and an empty one as none", () => {
    expect(parseEventSettingsInput(formWith({ marketplaceFormUrl: "http://forms.example.com" })).isValid).toBe(false);
    expect(parseEventSettingsInput(formWith({ marketplaceFormUrl: "https://forms.example.com/x" }))).toMatchObject({
      settings: { marketplaceFormUrl: "https://forms.example.com/x" },
    });
  });

  it("refuses a field that is not a date and time", () => {
    expect(parseEventSettingsInput(formWith({ itchOpensAt: "mañana" }))).toMatchObject({
      isValid: false,
      errors: { itchOpensAt: "Escribe una fecha y hora válidas." },
    });
  });
});

describe("getRelatedFields", () => {
  it("is the field itself and the other hour of its pair", () => {
    expect(getRelatedFields("checkInCutoffAt")).toEqual(["checkInCutoffAt", "checkInCutoffAt", "raffleStartsAt"]);
    expect(getRelatedFields("raffleStartsAt")).toContain("checkInCutoffAt");
  });

  it("is only the field when it has no pair", () => {
    expect(getRelatedFields("itchOpensAt")).toEqual(["itchOpensAt"]);
    expect(getRelatedFields("fraudTopScoreCount")).toEqual(["fraudTopScoreCount"]);
  });
});
