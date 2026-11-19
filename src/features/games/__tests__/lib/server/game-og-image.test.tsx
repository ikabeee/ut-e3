import { makeGame } from "@features/games/__tests__/components/game-test-data";
import {
  buildGameOgCard,
  GAME_OG_IMAGE_ALT,
  getGameOgImageAlt,
  getGameOgImagePath,
} from "@features/games/lib/server/game-og-image";
import { buildSiteOgCard } from "@shared/lib/og-image";

describe("buildGameOgCard", () => {
  it("says the name, the genre and the stand code of the game under the name of the event", () => {
    const game = makeGame({
      id: "true-hero",
      name: "True Hero",
      genre: { id: "action", name: "Acción", slug: "action" },
      stand: { zone: "A", number: 2 },
    });

    expect(buildGameOgCard(game)).toMatchObject({
      eyebrow: "PIXEL & CODE",
      title: "True Hero",
      details: ["Acción", "ZA-S2"],
    });
  });

  it("falls back to the card of the site, without details, for a game that does not exist", () => {
    expect(buildGameOgCard(null)).toEqual(buildSiteOgCard([]));
  });
});

describe("the image of a game", () => {
  it("lives next to its page and names its game in the alt text", () => {
    expect(getGameOgImagePath("true-hero")).toBe("/games/true-hero/opengraph-image");
    expect(getGameOgImageAlt({ name: "True Hero" })).toBe("Ficha de True Hero en PIXEL & CODE");
    expect(GAME_OG_IMAGE_ALT).toBe("Ficha de un juego de PIXEL & CODE");
  });
});
