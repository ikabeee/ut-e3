import { layoutLedText } from "@features/landing/lib/led-text";

function charCells(layout: ReturnType<typeof layoutLedText>, char: number) {
  return layout.cells.filter((cell) => cell.char === char);
}

function leftmostColumn(cells: { col: number }[]) {
  return Math.min(...cells.map((cell) => cell.col));
}

describe("layoutLedText", () => {
  it("lights 11 cells for an I: the 3-cell top and bottom bars and the 5-cell stem", () => {
    const layout = layoutLedText("I");

    expect(layout.cells).toHaveLength(11);
    expect(layout.columns).toBe(5);
    expect(layout.rows).toBe(7);
  });

  it("keeps every lit cell inside the 5x7 grid of its glyph", () => {
    const { cells } = layoutLedText("I");

    expect(Math.min(...cells.map((cell) => cell.row))).toBe(0);
    expect(Math.max(...cells.map((cell) => cell.row))).toBe(6);
    expect(Math.min(...cells.map((cell) => cell.col))).toBe(1);
    expect(Math.max(...cells.map((cell) => cell.col))).toBe(3);
  });

  it("lays characters left to right with one blank column between glyphs", () => {
    const layout = layoutLedText("II");

    expect(layout.cells).toHaveLength(22);
    expect(layout.columns).toBe(11);
    expect(leftmostColumn(charCells(layout, 0))).toBe(1);
    expect(leftmostColumn(charCells(layout, 1))).toBe(7);
  });

  it("leaves a 3-column gap plus the two blank columns for a space", () => {
    const layout = layoutLedText("I I");

    expect(layout.cells).toHaveLength(22);
    expect(layout.columns).toBe(5 + 1 + 3 + 1 + 5);
    expect(leftmostColumn(charCells(layout, 2))).toBe(11);
  });

  it("measures PIXEL & CODE as 67 columns wide", () => {
    expect(layoutLedText("PIXEL & CODE").columns).toBe(67);
  });
});
