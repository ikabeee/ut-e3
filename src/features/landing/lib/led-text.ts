export interface LedCell {
  col: number;
  row: number;
  char: number;
}

export interface LedLayout {
  cells: LedCell[];
  columns: number;
  rows: number;
}

const GLYPHS = {
  "0": [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."],
  "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  "3": ["####.", "....#", "....#", ".###.", "....#", "....#", "####."],
  "4": ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  "5": ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  "6": [".###.", "#....", "#....", "####.", "#...#", "#...#", ".###."],
  "7": ["#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#..."],
  "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  "9": [".###.", "#...#", "#...#", ".####", "....#", "....#", ".###."],
  "&": [".##..", "#..#.", "#.#..", ".#...", "#.#.#", "#..#.", ".##.#"],
  C: [".####", "#....", "#....", "#....", "#....", "#....", ".####"],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  I: [".###.", "..#..", "..#..", "..#..", "..#..", "..#..", ".###."],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
} as const satisfies Record<string, readonly string[]>;

const GLYPH_COLUMNS = 5;

const GLYPH_ROWS = 7;

const SPACE_COLUMNS = 3;

const GAP_COLUMNS = 1;

export function layoutLedText(text: string): LedLayout {
  const characters = [...text];
  const starts = columnStarts(characters);
  const cells = characters.flatMap((character, index) => glyphCells(character, index, starts[index]));

  return { cells, columns: totalColumns(characters), rows: GLYPH_ROWS };
}

function columnStarts(characters: string[]) {
  const starts: number[] = [];
  let nextStart = 0;

  for (const character of characters) {
    starts.push(nextStart);
    nextStart += widthOf(character) + GAP_COLUMNS;
  }

  return starts;
}

function totalColumns(characters: string[]) {
  const widths = characters.map((character) => widthOf(character) + GAP_COLUMNS);

  return widths.reduce((sum, width) => sum + width, 0) - GAP_COLUMNS;
}

function widthOf(character: string) {
  return character === " " ? SPACE_COLUMNS : GLYPH_COLUMNS;
}

function glyphCells(character: string, char: number, startColumn: number): LedCell[] {
  const glyph = glyphOf(character);

  return glyph.flatMap((line, row) => litColumns(line).map((offset) => ({ col: startColumn + offset, row, char })));
}

function litColumns(line: string) {
  return [...line].flatMap((bit, offset) => (bit === "#" ? [offset] : []));
}

function glyphOf(character: string): readonly string[] {
  return Object.entries(GLYPHS).find(([glyphCharacter]) => glyphCharacter === character)?.[1] ?? [];
}
