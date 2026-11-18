import { formatLongEventDate, getWhenGroups } from "@features/tournament/lib/tournament-when";

// Instants of event_settings; America/Cancun renders them as Friday 13 and Friday 20 of November 2026.
const SCHEDULE = {
  registrationOpensAt: "2026-11-13T05:00:00.000Z",
  checkInStartsAt: "2026-11-20T17:00:00.000Z",
  checkInEndsAt: "2026-11-20T17:45:00.000Z",
  onsiteStartsAt: "2026-11-20T17:00:00.000Z",
  onsiteEndsAt: "2026-11-20T17:45:00.000Z",
  bracketGeneratesAt: "2026-11-20T17:55:00.000Z",
};

describe("formatLongEventDate (S31)", () => {
  it("writes the weekday, the day and the month in Spanish, capitalized", () => {
    expect(formatLongEventDate("2026-11-13T05:00:00.000Z")).toBe("Viernes 13 de noviembre");
    expect(formatLongEventDate("2026-11-20T17:00:00.000Z")).toBe("Viernes 20 de noviembre");
  });

  it("reads the day in America/Cancun, not in UTC", () => {
    // 03:00 UTC of the 14th is still 22:00 of Friday the 13th in Cancun (UTC-5).
    expect(formatLongEventDate("2026-11-14T03:00:00.000Z")).toBe("Viernes 13 de noviembre");
  });

  it("covers a Sunday in January", () => {
    expect(formatLongEventDate("2027-01-03T18:00:00.000Z")).toBe("Domingo 3 de enero");
  });
});

describe("getWhenGroups (S31)", () => {
  it("groups the moments by date, earliest date first, each with its items in order", () => {
    expect(getWhenGroups(SCHEDULE)).toEqual([
      { key: "13.11.2026", label: "Viernes 13 de noviembre", items: ["Abre la inscripción"] },
      {
        key: "20.11.2026",
        label: "Viernes 20 de noviembre",
        items: [
          "Check-in de 12:00 a 12:45",
          "Inscripción en el lugar de 12:00 a 12:45",
          "El bracket se genera a las 12:55",
        ],
      },
    ]);
  });

  it("follows the settings: other instants give other dates and hours", () => {
    const groups = getWhenGroups({
      ...SCHEDULE,
      registrationOpensAt: "2026-12-01T06:00:00.000Z",
      checkInStartsAt: "2026-12-05T18:00:00.000Z",
      checkInEndsAt: "2026-12-05T18:30:00.000Z",
      onsiteStartsAt: "2026-12-05T18:00:00.000Z",
      onsiteEndsAt: "2026-12-05T18:30:00.000Z",
      bracketGeneratesAt: "2026-12-05T18:40:00.000Z",
    });

    expect(groups.map((group) => group.label)).toEqual(["Martes 1 de diciembre", "Sábado 5 de diciembre"]);
    expect(groups[1].items[0]).toBe("Check-in de 13:00 a 13:30");
  });
});
