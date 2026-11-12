import { gameInitials } from "@features/floor-plan/lib/game-initials";

describe("gameInitials", () => {
  it("takes the first and the last significant word of a quoted name", () => {
    expect(gameInitials("Make 'em Fall")).toBe("MF");
  });

  it("skips the connector word of a Spanish name", () => {
    expect(gameInitials("Sombra del Mictlán")).toBe("SM");
  });

  it("uppercases the initials of a shouting name", () => {
    expect(gameInitials("DON'T PET ME")).toBe("DM");
  });

  it("takes the first two letters of a one-word name", () => {
    expect(gameInitials("Hormigón")).toBe("HO");
  });
});
