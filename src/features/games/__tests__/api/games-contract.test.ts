import { parseGamesResponse, toGameDto, type GameDto } from "@features/games/api/games-contract";
import { GAME_FIXTURES } from "@features/games/__tests__/game-fixtures";
import type { JsonObject } from "@shared/lib/json-value";

/** Simula el viaje por HTTP: el DTO se serializa y se vuelve a leer como JSON. */
function overHttp(value: GameDto[]): JsonObject[] {
  // SAFETY: toGameDto solo produce registros serializables; JSON conserva su estructura de objeto.
  return JSON.parse(JSON.stringify(value)) as JsonObject[];
}

describe("games contract", () => {
  it("reads back every game sent by the route handler", () => {
    expect(parseGamesResponse(overHttp(GAME_FIXTURES.map(toGameDto)))).toEqual(GAME_FIXTURES);
  });

  it("rejects a response that is not a list", () => {
    expect(() => parseGamesResponse({ games: [] })).toThrow("se esperaba una lista");
  });

  it("names the first invalid field", () => {
    const [first, second] = overHttp(GAME_FIXTURES.slice(0, 2).map(toGameDto));

    expect(() => parseGamesResponse([first, { ...second, members: "4" }])).toThrow("[1].members");
    expect(() => parseGamesResponse([{ ...first, image: { src: "/a.jpg", position: null } }])).toThrow("[0].image.alt");
    expect(() => parseGamesResponse([{ ...first, stand: 4 }])).toThrow("[0].stand");
  });

  it("keeps the paragraphs of a game and rejects anything that is not text", () => {
    const [game] = overHttp([toGameDto({ ...GAME_FIXTURES[0], about: ["Primero.", "Segundo."] })]);

    expect(parseGamesResponse([game])[0].about).toEqual(["Primero.", "Segundo."]);
    expect(() => parseGamesResponse([{ ...game, about: ["Primero.", 2] }])).toThrow("[0].about[1]");
  });

  it("keeps a game without stand and validates its platforms and gallery", () => {
    const [game] = overHttp([toGameDto({ ...GAME_FIXTURES[0], stand: null })]);

    expect(parseGamesResponse([game])[0].stand).toBeNull();
    expect(() => parseGamesResponse([{ ...game, platforms: ["Windows", null] }])).toThrow("[0].platforms[1]");
    expect(() => parseGamesResponse([{ ...game, gallery: [{ src: "/a.jpg" }] }])).toThrow("[0].gallery[0].alt");
  });
});
