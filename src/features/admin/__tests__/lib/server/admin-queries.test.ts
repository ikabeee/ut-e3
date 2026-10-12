import { getAdminCatalog, getAdminGames, getAdminTeams } from "@features/admin/lib/server/admin-queries";
import { listGenres, listPlatforms } from "@features/games/lib/server/catalog-options-queries";
import { listGameRecords } from "@features/games/lib/server/games-admin-queries";
import { listTeams } from "@features/teams/lib/server/teams-queries";
import { isAdminRequest } from "@shared/lib/server/admin-auth";

jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));
jest.mock("@shared/lib/server/admin-auth", () => ({ isAdminRequest: jest.fn() }));
jest.mock("@features/games/lib/server/catalog-options-queries", () => ({
  listGenres: jest.fn(),
  listPlatforms: jest.fn(),
}));
jest.mock("@features/games/lib/server/games-admin-queries", () => ({ listGameRecords: jest.fn() }));
jest.mock("@features/teams/lib/server/teams-queries", () => ({ listTeams: jest.fn() }));
jest.mock("@features/visitors/lib/server/raffle-queries", () => ({ listRaffleWinners: jest.fn() }));

const team = { id: "team-1", name: "Equipo Grava", standCode: "A1", members: [], gameSlug: null };
const genre = { id: "genre-1", slug: "accion", name: "Acción" };
const platform = { id: "platform-1", slug: "web", name: "Web" };

describe("admin queries", () => {
  it("does not read anything without the admin credentials", async () => {
    jest.mocked(isAdminRequest).mockResolvedValue(false);

    await expect(getAdminTeams()).rejects.toThrow("NEXT_NOT_FOUND");
    await expect(getAdminCatalog()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(listTeams).not.toHaveBeenCalled();
    expect(listGenres).not.toHaveBeenCalled();
  });

  it("builds the select options of the games page", async () => {
    jest.mocked(isAdminRequest).mockResolvedValue(true);
    jest.mocked(listGameRecords).mockResolvedValue([]);
    jest.mocked(listTeams).mockResolvedValue([team]);
    jest.mocked(listGenres).mockResolvedValue([genre]);
    jest.mocked(listPlatforms).mockResolvedValue([platform]);

    await expect(getAdminGames()).resolves.toEqual({
      games: [],
      options: {
        teams: [{ value: "team-1", label: "Equipo Grava" }],
        genres: [{ value: "genre-1", label: "Acción" }],
        platforms: [{ value: "platform-1", label: "Web" }],
      },
    });
  });
});
