import { LANDING_GAMES, LANDING_TEAM_COUNT } from "@features/landing/lib/landing-games";

describe("LANDING_GAMES", () => {
  it("lists the three Figma cards in order", () => {
    expect(LANDING_GAMES.map((game) => game.name)).toEqual(["Videojuego 1", "Videojuego 2", "Videojuego 3"]);
  });

  it("gives every card the Figma genre and description", () => {
    for (const game of LANDING_GAMES) {
      expect(game.genre).toBe("Plataformas");
      expect(game.description).toBe("Sincroniza tus saltos con el bajo para cruzar una ciudad apagada.");
    }
  });

  it("serves every card image from public/landing/games", () => {
    for (const game of LANDING_GAMES) {
      expect(game.image.src).toMatch(/^\/landing\/games\/[a-z-]+\.webp$/);
    }
  });

  it("uses distinct ids", () => {
    expect(new Set(LANDING_GAMES.map((game) => game.id)).size).toBe(LANDING_GAMES.length);
  });
});

describe("LANDING_TEAM_COUNT", () => {
  it("is the 18 teams of the event", () => {
    expect(LANDING_TEAM_COUNT).toBe(18);
  });
});
