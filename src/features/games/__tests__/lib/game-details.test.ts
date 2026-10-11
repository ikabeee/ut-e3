import {
  describeGame,
  getGameFacts,
  getGameFeatures,
  getRelatedGames,
  getStandAisle,
} from "@features/games/lib/game-details";
import { MOCK_GAMES } from "@features/games/lib/mock-games";
import type { Game } from "@features/games/lib/types";

function findGame(slug: string): Game {
  const game = MOCK_GAMES.find((candidate) => candidate.slug === slug);
  if (!game) {
    throw new Error(`Missing mock game ${slug}`);
  }
  return game;
}

describe("game details", () => {
  it("takes the aisle from the stand code", () => {
    expect(getStandAisle("B7")).toBe("B");
  });

  it("adds the competitive feature only to games with a tournament", () => {
    expect(getGameFeatures(findGame("ruta-9"))).toEqual(["Demo jugable", "Un jugador", "Competitivo"]);
    expect(getGameFeatures(findGame("hormigon"))).toEqual(["Demo jugable", "Un jugador"]);
  });

  it("describes the tournament only when the game has one", () => {
    expect(describeGame(findGame("lucha-pixel"))).toHaveLength(2);
    expect(describeGame(findGame("cenote"))).toEqual([
      "Cenote es el proyecto de Equipo Raíz, 3 estudiantes de la División de Ingeniería y Tecnologías de la UT Cancún. En el evento vas a poder jugar una demo de unos 10 minutos y platicar con el equipo sobre cómo lo hicieron.",
    ]);
  });

  it("builds the fact sheet without the word Equipo", () => {
    expect(getGameFacts(findGame("turbina"), "27.11.2026")).toEqual([
      { label: "Equipo", value: "Pistón" },
      { label: "Integrantes", value: "4" },
      { label: "Género", value: "Carreras" },
      { label: "Stand", value: "A9" },
      { label: "Torneo", value: "Sí" },
      { label: "Evento", value: "27.11.2026" },
    ]);
  });
});

describe("getRelatedGames", () => {
  it("puts games of the same genre first and then the closest ones in the catalog", () => {
    const related = getRelatedGames(MOCK_GAMES, findGame("ruta-9"));

    expect(related.map((game) => game.slug)).toEqual(["turbina", "subsuelo", "kaiju-mercado", "eco-nulo", "templo-404"]);
  });

  it("wraps around the end of the catalog", () => {
    const related = getRelatedGames(MOCK_GAMES, findGame("circuito-7"));

    expect(related.map((game) => game.slug)).toEqual([
      "hormigon",
      "ceniza-protocol",
      "los-ultimos-faros",
      "ruta-9",
      "subsuelo",
    ]);
  });

  it("never includes the current game", () => {
    const current = findGame("eco-nulo");

    expect(getRelatedGames(MOCK_GAMES, current, 17)).not.toContainEqual(current);
  });
});
