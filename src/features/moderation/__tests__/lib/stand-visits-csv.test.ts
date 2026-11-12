import { buildStandVisitsCsv } from "@features/moderation/lib/stand-visits-csv";
import type { StandVisit } from "@features/moderation/lib/types";

const VISIT: StandVisit = {
  checkInId: "c1",
  visitorId: "v1",
  gamertag: "Player,One",
  at: "2026-11-20T19:00:00.000Z",
  recordedBy: "Staff",
  ratings: { game: 5, stand: 4, art: 3 },
  status: "valid",
};

describe("buildStandVisitsCsv", () => {
  it("writes a header and one row per visit, quoting what has a comma", () => {
    const [header, row] = buildStandVisitsCsv([VISIT]).split("\r\n");

    expect(header).toBe("Gamertag,Hora,Registró,Juego,Stand,Arte,Estado");
    expect(row).toBe('"Player,One",2026-11-20T19:00:00.000Z,Staff,5,4,3,Válida');
  });

  it("leaves the cells empty when there is no vote or nobody recorded the visit", () => {
    const csv = buildStandVisitsCsv([
      { ...VISIT, gamertag: "Ana", recordedBy: null, ratings: null, status: "annulled" },
    ]);

    expect(csv).toContain("Ana,2026-11-20T19:00:00.000Z,,,,,Anulada");
  });

  it("defuses a gamertag that a spreadsheet would run as a formula", () => {
    expect(buildStandVisitsCsv([{ ...VISIT, gamertag: "=HYPERLINK(1)" }])).toContain("'=HYPERLINK(1)");
  });
});
