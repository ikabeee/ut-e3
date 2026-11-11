import { buildGameSlug, pickFreeSlug, isGameSlug } from "@features/games/lib/game-slug";

describe("buildGameSlug", () => {
  it("lower cases the name and joins the words with hyphens", () => {
    expect(buildGameSlug("Ruta Nueve")).toBe("ruta-nueve");
  });

  it("drops the accents and the symbols", () => {
    expect(buildGameSlug("¡Hormigón: el Último Faro!")).toBe("hormigon-el-ultimo-faro");
  });

  it("does not leave hyphens at the ends", () => {
    expect(buildGameSlug("  --Eco/Nulo--  ")).toBe("eco-nulo");
  });

  it("falls back to a generic slug when the name has no letters or digits", () => {
    expect(buildGameSlug("???")).toBe("juego");
  });
});

describe("pickFreeSlug", () => {
  it("keeps the slug when nobody uses it", () => {
    expect(pickFreeSlug("ruta-9", new Set(["otro"]))).toBe("ruta-9");
  });

  it("adds the first free number when the slug is taken", () => {
    expect(pickFreeSlug("ruta-9", new Set(["ruta-9", "ruta-9-2"]))).toBe("ruta-9-3");
  });
});

describe("isGameSlug", () => {
  it.each(["abby-s-tower", "laboratorio-4", "juego-2"])("accepts %s, a slug buildGameSlug can produce", (slug) => {
    expect(isGameSlug(slug)).toBe(true);
  });

  it.each(["zzz.png", "..", ".", "Abby", "abby--tower", "-abby", "abby-", "", "a".repeat(81)])(
    "refuses %s before anything looks it up",
    (slug) => {
      expect(isGameSlug(slug)).toBe(false);
    },
  );
});
