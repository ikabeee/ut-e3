import {
  describeGame,
  formatStand,
  getGameFacts,
  getGameFeatures,
  getRelatedGames,
  getStandAisle,
} from "@features/games/lib/game-details";
import { GAME_FIXTURES } from "@features/games/__tests__/game-fixtures";
import type { Game } from "@features/games/lib/types";

function findGame(slug: string): Game {
  const game = GAME_FIXTURES.find((candidate) => candidate.slug === slug);

  if (!game) {
    throw new Error(`Missing mock game ${slug}`);
  }

  return game;
}

describe("game details", () => {
  it("takes the aisle from the stand code", () => {
    expect(getStandAisle("B7")).toBe("B");
  });

  it("shows 'Por asignar' while the team has no stand", () => {
    expect(formatStand("A4")).toBe("A4");
    expect(formatStand(null)).toBe("Por asignar");
    expect(getStandAisle(null)).toBe("Por asignar");
  });

  it("lists the demo, the players and the platforms", () => {
    expect(getGameFeatures(findGame("ceniza-protocol"))).toEqual([
      "Demo jugable",
      "Un jugador",
      "Windows",
      "Web (navegador)",
    ]);
    expect(getGameFeatures({ ...findGame("hormigon"), players: 4 })).toEqual([
      "Demo jugable",
      "4 jugadores",
      "Windows",
    ]);
  });

  it("uses the generic text when the game has no paragraphs", () => {
    expect(describeGame(findGame("cenote"))).toEqual([
      "Cenote es el proyecto de Equipo Raíz, 3 estudiantes de la División de Ingeniería y Tecnologías de la UT Cancún. En el evento vas a poder jugar una demo de unos 10 minutos y platicar con el equipo sobre cómo lo hicieron.",
    ]);
  });

  it("uses the paragraphs of the game when it has them", () => {
    const game = { ...findGame("cenote"), about: ["Explora un cenote.", "Hecho en Godot."] };

    expect(describeGame(game)).toEqual(["Explora un cenote.", "Hecho en Godot."]);
  });

  it("builds the fact sheet without the word Equipo", () => {
    expect(getGameFacts(findGame("turbina"), "27.11.2026")).toEqual([
      { label: "Equipo", value: "Pistón" },
      { label: "Integrantes", value: "4" },
      { label: "Género", value: "Carreras" },
      { label: "Stand", value: "A9" },
      { label: "Evento", value: "27.11.2026" },
    ]);
  });
});

describe("getRelatedGames", () => {
  it("puts games of the same genre first and then the closest ones in the catalog", () => {
    const related = getRelatedGames(GAME_FIXTURES, findGame("ruta-9"));

    expect(related.map((game) => game.slug)).toEqual([
      "turbina",
      "eco-nulo",
      "pulso-cero",
      "xibalba-run",
      "lucha-pixel",
    ]);
  });

  it("wraps around the end of the catalog", () => {
    const related = getRelatedGames(GAME_FIXTURES, findGame("circuito-7"));

    expect(related.map((game) => game.slug)).toEqual([
      "hormigon",
      "ceniza-protocol",
      "los-ultimos-faros",
      "ruta-9",
      "eco-nulo",
    ]);
  });

  it("never includes the current game", () => {
    const current = findGame("eco-nulo");

    expect(getRelatedGames(GAME_FIXTURES, current, 17)).not.toContainEqual(current);
  });
});
