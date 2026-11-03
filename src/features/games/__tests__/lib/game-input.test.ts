import { GAME_NAME_MAX_LENGTH, GAME_SYNOPSIS_MAX_LENGTH, parseStandGameInput } from "@features/games/lib/game-input";
import { GAMES_COPY } from "@features/games/lib/games-copy";

const ERRORS = GAMES_COPY.standGame.errors;

describe("parseStandGameInput (RF-31)", () => {
  it("reads and trims the fields of the game", () => {
    const parsed = parseStandGameInput(
      form({ name: "  Ruta 9 ", synopsis: " Carreras. ", genreId: "genre-1", itchUrl: "" }),
    );

    expect(parsed).toEqual({
      isValid: true,
      input: { name: "Ruta 9", synopsis: "Carreras.", genreId: "genre-1", itchUrl: null },
    });
  });

  it("accepts an https link to itch.io or one of its subdomains", () => {
    const itchUrl = "https://studio.itch.io/ruta-9";
    const parsed = parseStandGameInput(form({ itchUrl }));

    expect(parsed).toMatchObject({ isValid: true, input: { itchUrl } });
  });

  it.each([`${"http"}://studio.itch.io/ruta`, "https://evil.example/itch.io", "https://notitch.io/x", "ruta-9"])(
    "refuses the link %s",
    (itchUrl) => {
      expect(parseStandGameInput(form({ itchUrl }))).toEqual({ isValid: false, message: ERRORS.itchInvalid });
    },
  );

  it("requires the name, within its maximum length", () => {
    const invalid = { isValid: false, message: ERRORS.nameRequired };

    expect(parseStandGameInput(form({ name: "   " }))).toEqual(invalid);
    expect(parseStandGameInput(form({ name: "x".repeat(GAME_NAME_MAX_LENGTH + 1) }))).toEqual(invalid);
  });

  it("requires the synopsis, within its maximum length", () => {
    const invalid = { isValid: false, message: ERRORS.synopsisRequired };

    expect(parseStandGameInput(form({ synopsis: "" }))).toEqual(invalid);
    expect(parseStandGameInput(form({ synopsis: "x".repeat(GAME_SYNOPSIS_MAX_LENGTH + 1) }))).toEqual(invalid);
  });

  it("requires a genre", () => {
    expect(parseStandGameInput(form({ genreId: "" }))).toEqual({ isValid: false, message: ERRORS.genreInvalid });
  });

  it("has no field for the stand or the images: whatever the form carries for them is ignored", () => {
    const parsed = parseStandGameInput(form({ standId: "another-stand", gameId: "another-game", cover: "/x.jpg" }));

    expect(parsed).toMatchObject({ isValid: true });
    expect(parsed).not.toHaveProperty("input.standId");
    expect(parsed).not.toHaveProperty("input.gameId");
  });
});

function form(overrides: Record<string, string>): FormData {
  const fields = { name: "Ruta 9", synopsis: "Carreras.", genreId: "genre-1", itchUrl: "", ...overrides };
  const data = new FormData();

  Object.entries(fields).forEach(([name, value]) => data.append(name, value));

  return data;
}
