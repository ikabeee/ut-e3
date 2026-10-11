import { parseGamesResponse, toGameDto } from "@features/games/api/games-contract";
import { GAME_FIXTURES } from "@features/games/lib/game-fixtures";

/** Simula el viaje por HTTP: el DTO se serializa y se vuelve a leer como JSON. */
const overHttp = (value: unknown): unknown => JSON.parse(JSON.stringify(value));

describe("games contract", () => {
  it("reads back every game sent by the route handler", () => {
    expect(parseGamesResponse(overHttp(GAME_FIXTURES.map(toGameDto)))).toEqual(GAME_FIXTURES);
  });

  it("rejects a response that is not a list", () => {
    expect(() => parseGamesResponse({ games: [] })).toThrow("se esperaba una lista");
  });

  it("names the first invalid field", () => {
    const [first, second] = overHttp(GAME_FIXTURES.slice(0, 2).map(toGameDto)) as Record<string, unknown>[];

    expect(() => parseGamesResponse([first, { ...second, members: "4" }])).toThrow("[1].members");
    expect(() => parseGamesResponse([{ ...first, image: { src: "/a.jpg" } }])).toThrow("[0].image.position");
  });

  it("keeps the paragraphs of a game and rejects anything that is not text", () => {
    const [game] = overHttp([toGameDto({ ...GAME_FIXTURES[0], about: ["Primero.", "Segundo."] })]) as Record<string, unknown>[];

    expect(parseGamesResponse([game])[0].about).toEqual(["Primero.", "Segundo."]);
    expect(() => parseGamesResponse([{ ...game, about: ["Primero.", 2] }])).toThrow("[0].about[1]");
  });

  it("rejects colors outside the design palette", () => {
    const [game] = overHttp([toGameDto(GAME_FIXTURES[0])]) as Record<string, unknown>[];

    expect(() => parseGamesResponse([{ ...game, art: { seed: 1, palette: ["acid", "pink"] } }])).toThrow(
      "[0].art.palette[1]",
    );
  });
});
