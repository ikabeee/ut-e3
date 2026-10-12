import { countMissingGames, formatTicketNumber, getRaffleStage } from "@features/visitors/lib/passport";
import type { VisitorPassport } from "@features/visitors/lib/types";

const passport: VisitorPassport = {
  gamertag: "neo_99",
  qrUrl: "https://utg.example/v/0123456789abcdef0123456789abcdef",
  games: [],
  checkedCount: 17,
  requiredCount: 18,
  ticket: null,
};

describe("getRaffleStage", () => {
  it("unlocks the ticket form only after trying every game", () => {
    expect(getRaffleStage(passport)).toBe("locked");
    expect(getRaffleStage({ ...passport, checkedCount: 18 })).toBe("claim");
    expect(getRaffleStage({ ...passport, checkedCount: 18, ticket: { ticketNumber: 7, wonAt: null } })).toBe("ticket");
  });

  it("stays locked while no team has a stand", () => {
    expect(getRaffleStage({ ...passport, checkedCount: 0, requiredCount: 0 })).toBe("locked");
  });
});

describe("passport helpers", () => {
  it("counts the missing games", () => {
    expect(countMissingGames(passport)).toBe(1);
    expect(countMissingGames({ ...passport, checkedCount: 20 })).toBe(0);
  });

  it("pads the ticket number", () => {
    expect(formatTicketNumber(7)).toBe("0007");
    expect(formatTicketNumber(12345)).toBe("12345");
  });
});
