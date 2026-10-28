import { getTicketProgress } from "@features/visitors/lib/passport-progress";

describe("getTicketProgress", () => {
  it("counts from zero toward the first milestone when there are no visits", () => {
    expect(getTicketProgress(0)).toEqual({ complete: false, visits: 0, target: 9, remaining: 9, ratio: 0 });
  });

  it("shows the visits made toward the first milestone (RF-21)", () => {
    expect(getTicketProgress(4)).toEqual({ complete: false, visits: 4, target: 9, remaining: 5, ratio: 4 / 9 });
  });

  it("restarts the bar at zero toward the second milestone after the first ticket", () => {
    expect(getTicketProgress(9)).toEqual({ complete: false, visits: 9, target: 18, remaining: 9, ratio: 0 });
  });

  it("is one visit away from the second milestone at 17 visits", () => {
    expect(getTicketProgress(17)).toEqual({ complete: false, visits: 17, target: 18, remaining: 1, ratio: 8 / 9 });
  });

  it("is complete at 18 visits and stays complete after it (RF-22: at most 2 tickets)", () => {
    expect(getTicketProgress(18)).toEqual({ complete: true, visits: 18, target: null, remaining: 0, ratio: 1 });
    expect(getTicketProgress(25)).toEqual({ complete: true, visits: 25, target: null, remaining: 0, ratio: 1 });
  });
});
