/** @jest-environment node */

import { getAdminCatalog, getAdminGames, getAdminTeams } from "@features/admin/lib/server/admin-queries";

const team = { id: "team-1", name: "Equipo Grava", standCode: "A1", members: [], gameSlug: null };

const genre = { id: "genre-1", slug: "accion", name: "Acción" };

const platform = { id: "platform-1", slug: "web", name: "Web" };

describe("admin queries", () => {
  it("does not read anything without the admin credentials", async () => {
    const listTeamsMock = jest.fn();
    const listGenresMock = jest.fn();

    const notFoundMock = jest.fn(() => {
      throw new Error("NEXT_NOT_FOUND");
    });

    const deps = {
      checkAdmin: async () => false,
      onNotFound: notFoundMock,
      listTeams: listTeamsMock,
      listGenres: listGenresMock,
    };

    await expect(getAdminTeams(deps)).rejects.toThrow("NEXT_NOT_FOUND");
    await expect(getAdminCatalog(deps)).rejects.toThrow("NEXT_NOT_FOUND");
    expect(listTeamsMock).not.toHaveBeenCalled();
    expect(listGenresMock).not.toHaveBeenCalled();
  });

  it("builds the select options of the games page", async () => {
    const deps = {
      checkAdmin: async () => true,
      listGameRecords: async () => [],
      listTeams: async () => [team],
      listGenres: async () => [genre],
      listPlatforms: async () => [platform],
    };

    await expect(getAdminGames(deps)).resolves.toEqual({
      games: [],
      options: {
        teams: [{ value: "team-1", label: "Equipo Grava" }],
        genres: [{ value: "genre-1", label: "Acción" }],
        platforms: [{ value: "platform-1", label: "Web" }],
      },
    });
  });
});
