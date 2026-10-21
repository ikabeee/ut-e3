import { getEventContent } from "@features/event/lib/event-content";
import { EVENT_DYNAMICS } from "@features/event/lib/event-dynamics";

describe("EVENT_DYNAMICS", () => {
  it("lists the two tournaments and the raffle in display order", () => {
    expect(EVENT_DYNAMICS.map((dynamic) => dynamic.id)).toEqual(["kof", "smash", "raffle"]);
  });

  it("gives every tournament a format and a player quota, and the raffle neither", () => {
    for (const dynamic of EVENT_DYNAMICS) {
      expect(dynamic.format !== undefined && dynamic.players !== undefined).toBe(dynamic.kind === "tournament");
    }
  });

  it("is read through getEventContent", () => {
    expect(getEventContent().dynamics).toBe(EVENT_DYNAMICS);
  });
});
