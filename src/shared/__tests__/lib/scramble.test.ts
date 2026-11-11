import { SCRAMBLE_FRAMES, SCRAMBLE_GLYPHS, scrambleFrame } from "@shared/lib/scramble";

describe("scrambleFrame", () => {
  const alwaysFirstGlyph = () => 0;

  it("replaces every character except spaces on the first frames", () => {
    const frame = scrambleFrame("Ver todo", 0, alwaysFirstGlyph);

    expect(frame).toBe(`${SCRAMBLE_GLYPHS[0].repeat(3)} ${SCRAMBLE_GLYPHS[0].repeat(4)}`);
  });

  it("reveals the label from left to right", () => {
    const frame = scrambleFrame("ABCDEFGHI", 3, alwaysFirstGlyph);

    expect(frame.startsWith("ABC")).toBe(true);
    expect(frame.slice(3)).toBe(SCRAMBLE_GLYPHS[0].repeat(6));
  });

  it("returns the full label on the last frame", () => {
    expect(scrambleFrame("Croquis", SCRAMBLE_FRAMES, alwaysFirstGlyph)).toBe("Croquis");
  });
});
