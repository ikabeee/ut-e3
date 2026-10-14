/**
 * @jest-environment node
 */
import { claimRaffleTicket } from "@features/visitors/lib/server/raffle-queries";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";

const mockCheckedGameIds: string[] = [];

const TOKEN = "0123456789abcdef0123456789abcdef";

const game = (id: string, standCode: string) => ({ id, slug: id, name: id, standCode });

describe("claimRaffleTicket", () => {
  beforeEach(() => {
    mockCheckedGameIds.length = 0;
  });

  it("explains that the raffle is not open while no team has a stand", async () => {
    const deps = {
      findVisitor: async () => ({ id: "visitor-1", gamertag: "pixel" }),
      fetchRequiredGames: async () => [],
      findExistingTicket: async () => null,
      fetchCheckedGameIds: async () => mockCheckedGameIds,
    };

    await expect(claimRaffleTicket(TOKEN, "+529981234567", deps)).rejects.toThrow(VISITORS_COPY.raffle.noStands);
  });

  it("tells how many games are still missing", async () => {
    mockCheckedGameIds.push("game-1");

    const deps = {
      findVisitor: async () => ({ id: "visitor-1", gamertag: "pixel" }),
      fetchRequiredGames: async () => [game("game-1", "A1"), game("game-2", "A2")],
      findExistingTicket: async () => null,
      fetchCheckedGameIds: async () => mockCheckedGameIds,
    };

    await expect(claimRaffleTicket(TOKEN, "+529981234567", deps)).rejects.toThrow(VISITORS_COPY.raffle.notYet(1));
  });
});
