import { makeGame, makeGames } from "@features/games/__tests__/components/game-test-data";
import { getRelatedGames } from "@features/games/lib/related-games";

const games = makeGames(9);

function namesOf(list: { name: string }[]) {
  return list.map((game) => game.name);
}

describe("getRelatedGames", () => {
  it("lists the games of the same genre first, then the rest in catalog order after the current game", () => {
    const current = games[3];

    expect(namesOf(getRelatedGames(games, current))).toEqual([
      "Juego 07",
      "Juego 01",
      "Juego 05",
      "Juego 06",
      "Juego 08",
    ]);
  });

  it("never includes the current game", () => {
    const current = games[0];

    expect(getRelatedGames(games, current, games.length)).not.toContainEqual(current);
    expect(getRelatedGames(games, current, games.length)).toHaveLength(games.length - 1);
  });

  it("returns at most five games by default", () => {
    expect(getRelatedGames(games, games[0])).toHaveLength(5);
  });

  it("returns an empty list when the current game is the only one", () => {
    const only = makeGame({ id: "solo", name: "Solo" });

    expect(getRelatedGames([only], only)).toEqual([]);
  });
});
