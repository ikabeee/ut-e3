import { filterEntries, getEntryCounts, type EntryFilter } from "@features/tournament/lib/entries-view";
import type { EntryView } from "@features/tournament/lib/types";

function entry(index: number, channel: EntryView["channel"], status: EntryView["status"]): EntryView {
  return {
    id: `entry-${index}`,
    visitorId: `visitor-${index}`,
    gamertag: `Jugador${index}`,
    fullName: `Nombre ${index}`,
    channel,
    status,
    checkedInAt: status === "checked_in" ? "2026-11-20T17:20:00.000Z" : null,
  };
}

describe("getEntryCounts", () => {
  it("counts zero for an empty list", () => {
    expect(getEntryCounts([])).toEqual({ registered: 0, checkedIn: 0, noShow: 0, preList: 0, places: 0 });
  });

  it("counts each status, the pre-registration list and the places that are still taken", () => {
    const entries = [
      entry(1, "pre", "registered"),
      entry(2, "pre", "checked_in"),
      entry(3, "pre", "no_show"),
      entry(4, "onsite", "checked_in"),
      entry(5, "onsite", "checked_in"),
    ];

    expect(getEntryCounts(entries)).toEqual({ registered: 1, checkedIn: 3, noShow: 1, preList: 3, places: 4 });
  });
});

describe("filterEntries", () => {
  const entries = [
    entry(1, "pre", "registered"),
    { ...entry(2, "pre", "checked_in"), gamertag: "Ñandú", fullName: "María José Pérez" },
    entry(3, "onsite", "checked_in"),
    entry(4, "pre", "no_show"),
  ];

  function gamertags(filter: Partial<EntryFilter>): string[] {
    return filterEntries(entries, { text: "", status: "all", pinMatchId: null, ...filter }).map(
      (item) => item.gamertag,
    );
  }

  it("keeps every entry with an empty text and no status", () => {
    expect(gamertags({ text: "  " })).toHaveLength(4);
  });

  it("finds the gamertag and the name, ignoring case and accents", () => {
    expect(gamertags({ text: "NANDU" })).toEqual(["Ñandú"]);
    expect(gamertags({ text: "jose perez" })).toEqual(["Ñandú"]);
    expect(gamertags({ text: "jugador1" })).toEqual(["Jugador1"]);
  });

  it("adds the entry the server found for the PIN", () => {
    expect(gamertags({ text: "00003", pinMatchId: "entry-3" })).toEqual(["Jugador3"]);
  });

  it("keeps only the status of the filter", () => {
    expect(gamertags({ status: "registered" })).toEqual(["Jugador1"]);
    expect(gamertags({ status: "checked_in" })).toEqual(["Ñandú", "Jugador3"]);
    expect(gamertags({ status: "checked_in", text: "jugador" })).toEqual(["Jugador3"]);
    expect(gamertags({ status: "no_show" })).toEqual(["Jugador4"]);
  });

  it("returns nothing when no entry matches", () => {
    expect(gamertags({ text: "zzz" })).toEqual([]);
  });
});
