import { buildGameStructuredData } from "@features/games/lib/game-structured-data";
import { GAME_FIXTURES } from "@features/games/lib/game-fixtures";

describe("buildGameStructuredData", () => {
  it("describes the game as a schema.org VideoGame with absolute URLs", () => {
    expect(buildGameStructuredData(GAME_FIXTURES[0], "https://utg.example")).toMatchObject({
      "@type": "VideoGame",
      name: "Ceniza Protocol",
      genre: "Acción",
      url: "https://utg.example/games/ceniza-protocol",
      image: "https://utg.example/mock/games/ceniza-protocol.jpg",
      author: { "@type": "Organization", name: "Equipo Grava" },
    });
  });

  it("omits the image when the game has none", () => {
    expect(buildGameStructuredData(GAME_FIXTURES[2], "https://utg.example")).not.toHaveProperty("image");
  });
});
