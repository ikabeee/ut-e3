import { INITIAL_SCHEDULE_ITEMS } from "@features/schedule/lib/server/schedule-seed";

const KOF_TITLE = /KOF/;

function findItem(title: string) {
  return INITIAL_SCHEDULE_ITEMS.find((item) => item.title === title);
}

describe("INITIAL_SCHEDULE_ITEMS", () => {
  it("has exactly three KOF items", () => {
    const kofTitles = INITIAL_SCHEDULE_ITEMS.filter((item) => KOF_TITLE.test(item.title)).map((item) => item.title);

    expect(kofTitles).toEqual([
      "Check-in del torneo de KOF",
      "Inscripción presencial al torneo de KOF",
      "Rondas del torneo de KOF",
    ]);
  });

  it("starts the KOF check-in at 11:00 Cancun at the KOF stand, where the pre-list confirms with the PIN", () => {
    const item = findItem("Check-in del torneo de KOF");

    expect(item).toMatchObject({ startsAt: "2026-11-20T16:00:00.000Z", zone: "kof" });
    expect(item?.description).toMatch(/PIN/);
  });

  it("starts the on-site KOF signup at 12:00 Cancun at the help desk, until the 64 places fill", () => {
    const item = findItem("Inscripción presencial al torneo de KOF");

    expect(item).toMatchObject({ startsAt: "2026-11-20T17:00:00.000Z", zone: "help-desk" });
    expect(item?.description).toMatch(/\b64\b/);
  });

  it("starts the KOF rounds at 13:00 Cancun at the KOF stand", () => {
    expect(findItem("Rondas del torneo de KOF")).toMatchObject({ startsAt: "2026-11-20T18:00:00.000Z", zone: "kof" });
  });

  it("keeps the other items", () => {
    const otherIds = INITIAL_SCHEDULE_ITEMS.filter((item) => !KOF_TITLE.test(item.title)).map((item) => item.id);

    expect(otherIds).toEqual([
      "opening",
      "teams-presentation",
      "first-guest-talk",
      "second-guest-talk",
      "raffle-visits-cutoff",
      "raffle",
      "closing",
    ]);
  });
});
