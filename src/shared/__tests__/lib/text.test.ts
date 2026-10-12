import { formatList, normalizeText, pluralize } from "@shared/lib/text";

describe("text helpers", () => {
  it("lists items in Spanish", () => {
    expect(formatList(["13:00"])).toBe("13:00");
    expect(formatList(["13:00", "16:00", "19:00"])).toBe("13:00, 16:00 y 19:00");
  });

  it("compares texts without accents or case", () => {
    expect(normalizeText("Xibalbá")).toBe("xibalba");
  });

  it("chooses singular or plural", () => {
    expect(pluralize(1, "juego", "juegos")).toBe("juego");
    expect(pluralize(2, "juego", "juegos")).toBe("juegos");
  });
});
