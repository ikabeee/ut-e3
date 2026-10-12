import { findStandTraffic, getTrafficLevel } from "@features/visitors/lib/stand-traffic";

describe("stand traffic", () => {
  it.each([
    [0, "low"],
    [4, "low"],
    [5, "medium"],
    [9, "medium"],
    [10, "high"],
  ])("rates %i recent check-ins as %s", (count, level) => {
    expect(getTrafficLevel(count)).toBe(level);
  });

  it("finds the traffic of a stand", () => {
    const stands = [{ standCode: "A1", recentCheckIns: 3 }];
    expect(findStandTraffic(stands, "A1")).toEqual(stands[0]);
    expect(findStandTraffic(stands, "B2")).toBeNull();
  });
});
