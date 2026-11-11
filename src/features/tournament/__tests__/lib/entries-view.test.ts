import { getEntryCounts } from "@features/tournament/lib/entries-view";
import type { EntryView } from "@features/tournament/lib/types";

function entry(index: number, channel: EntryView["channel"], status: EntryView["status"]): EntryView {
  return {
    id: `entry-${index}`,
    visitorId: `visitor-${index}`,
    gamertag: `Jugador${index}`,
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
