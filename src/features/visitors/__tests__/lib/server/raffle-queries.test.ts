/**
 * @jest-environment node
 */
import { claimRaffleTicket } from "@features/visitors/lib/server/raffle-queries";
import { findVisitorByToken, listRequiredGames } from "@features/visitors/lib/server/visitors-queries";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";

jest.mock("@features/visitors/lib/server/visitors-queries", () => ({
  findVisitorByToken: jest.fn(),
  listRequiredGames: jest.fn(),
}));

// Consultas encadenadas de Prisma con lo mínimo que usa `claimRaffleTicket`: el visitante todavía
// no tiene boleto y probó los juegos de `mockCheckedGameIds` (el prefijo `mock` permite usar la
// variable dentro de `jest.mock`).
const mockCheckedGameIds: string[] = [];

jest.mock("@shared/lib/prisma/db", () => ({
  db: {
    orm: {
      public: {
        RaffleTicket: { select: () => ({ where: () => ({ first: async () => null }) }) },
        CheckIn: {
          select: () => ({ where: () => ({ all: async () => mockCheckedGameIds.map((gameId) => ({ gameId })) }) }),
        },
      },
    },
  },
}));

const TOKEN = "0123456789abcdef0123456789abcdef";

const game = (id: string, standCode: string) => ({ id, slug: id, name: id, standCode });

describe("claimRaffleTicket", () => {
  beforeEach(() => {
    jest.mocked(findVisitorByToken).mockResolvedValue({ id: "visitor-1", gamertag: "pixel" });
    mockCheckedGameIds.length = 0;
  });

  it("explains that the raffle is not open while no team has a stand", async () => {
    jest.mocked(listRequiredGames).mockResolvedValue([]);

    await expect(claimRaffleTicket(TOKEN, "+529981234567")).rejects.toThrow(VISITORS_COPY.raffle.noStands);
  });

  it("tells how many games are still missing", async () => {
    jest.mocked(listRequiredGames).mockResolvedValue([game("game-1", "A1"), game("game-2", "A2")]);
    mockCheckedGameIds.push("game-1");

    await expect(claimRaffleTicket(TOKEN, "+529981234567")).rejects.toThrow(VISITORS_COPY.raffle.notYet(1));
  });
});
