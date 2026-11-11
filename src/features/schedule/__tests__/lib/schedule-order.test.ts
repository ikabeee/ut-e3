import type { ScheduleItem } from "@features/schedule/lib/types";
import { sortScheduleItems } from "@features/schedule/lib/schedule-order";

function buildItem(id: string, startsAt: string): ScheduleItem {
  return { id, title: id, description: "", startsAt, endsAt: startsAt, zone: null };
}

describe("sortScheduleItems", () => {
  const opening = buildItem("opening", "2026-11-20T17:00:00.000Z");
  const talk = buildItem("talk", "2026-11-20T19:00:00.000Z");
  const raffle = buildItem("raffle", "2026-11-20T23:00:00.000Z");

  it("orders items captured out of order by start time", () => {
    const sorted = sortScheduleItems([raffle, opening, talk]);

    expect(sorted.map((item) => item.id)).toEqual(["opening", "talk", "raffle"]);
  });

  it("returns a new array and leaves the input untouched", () => {
    const input = [raffle, opening, talk];

    const sorted = sortScheduleItems(input);

    expect(sorted).not.toBe(input);
    expect(input.map((item) => item.id)).toEqual(["raffle", "opening", "talk"]);
  });

  it("returns an empty list for no items", () => {
    expect(sortScheduleItems([])).toEqual([]);
  });
});
