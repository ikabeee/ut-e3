import { parseCatalogOptionInput, parseGameImageInput, parseGameInput } from "@features/games/lib/catalog-validation";
import { ValidationError } from "@shared/lib/validation";

const TEAM_ID = "6d94503f-3e3b-4e6e-8bc6-445cd33ed099";

const GENRE_ID = "8c49deed-39e3-4206-b49e-af7023940ae8";

const PLATFORM_ID = "7db42818-6594-4783-909c-be90f74aa2b4";

const validGame = {
  teamId: TEAM_ID,
  genreId: GENRE_ID,
  slug: "ruta-9",
  name: "Ruta 9",
  description: "Carreras arcade nocturnas.",
  itchioUrl: "https://ruido.itch.io/ruta-9",
  sortOrder: "3",
  platformIds: [PLATFORM_ID],
};

function fieldErrors(run: () => unknown) {
  try {
    run();
  } catch (error) {
    if (error instanceof ValidationError) return error.fieldErrors;
    throw error;
  }

  return {};
}

describe("parseGameInput", () => {
  it("accepts a complete game", () => {
    expect(parseGameInput(validGame)).toEqual({
      ...validGame,
      about: null,
      players: 1,
      sortOrder: 3,
      extraGenreIds: [],
    });
  });

  it("keeps the paragraphs of 'Acerca del juego' and checks the players", () => {
    expect(parseGameInput({ ...validGame, about: " Primero.\n\nSegundo. ", players: "4" })).toMatchObject({
      about: "Primero.\n\nSegundo.",
      players: 4,
    });
    expect(fieldErrors(() => parseGameInput({ ...validGame, players: 0 }))).toEqual({
      players: "Los jugadores debe ser un número entero entre 1 y 16.",
    });
  });

  it("requires at least one platform and a valid itch.io page", () => {
    expect(
      fieldErrors(() => parseGameInput({ ...validGame, platformIds: [], itchioUrl: "https://example.com" })),
    ).toEqual({
      itchioUrl: "El enlace debe ser una página de itch.io (https://<usuario>.itch.io/...).",
      platformIds: "Elige al menos una plataforma.",
    });
  });

  it("does not repeat the main genre among the extra ones", () => {
    expect(fieldErrors(() => parseGameInput({ ...validGame, extraGenreIds: [GENRE_ID] }))).toEqual({
      extraGenreIds: "Los géneros extra no pueden repetir el género principal.",
    });
  });

  it("asks for a team and a main genre", () => {
    expect(fieldErrors(() => parseGameInput({ ...validGame, teamId: "x", genreId: "" }))).toMatchObject({
      teamId: "Elige un equipo.",
      genreId: "El género principal es obligatorio.",
    });
  });
});

describe("parseGameImageInput", () => {
  const hosts = ["img.itch.zone"];

  it("accepts site paths and https URLs of an allowed host", () => {
    expect(
      parseGameImageInput(
        { imageUrl: "/mock/games/ruta-9.jpg", altText: "Portada", sortOrder: 0, isCover: true },
        hosts,
      ),
    ).toEqual({
      imageUrl: "/mock/games/ruta-9.jpg",
      altText: "Portada",
      cropPosition: null,
      isCover: true,
      sortOrder: 0,
    });
    expect(
      parseGameImageInput({ imageUrl: "https://img.itch.zone/a.png", altText: "Captura", sortOrder: 1 }, hosts),
    ).toMatchObject({ imageUrl: "https://img.itch.zone/a.png" });
  });

  it("rejects other hosts, protocol-relative URLs and positions outside the gallery", () => {
    expect(
      fieldErrors(() => parseGameImageInput({ imageUrl: "//evil.example/x.jpg", altText: "x", sortOrder: 5 }, hosts)),
    ).toEqual({
      imageUrl: "La imagen debe ser una ruta del sitio (/...) o una URL https de un dominio permitido: img.itch.zone.",
      sortOrder: "La posición debe ser un número entero entre 0 y 4.",
    });
    expect(
      fieldErrors(() =>
        parseGameImageInput({ imageUrl: "https://evil.example/x.jpg", altText: "x", sortOrder: 1 }, []),
      ),
    ).toEqual({
      imageUrl:
        "La imagen debe ser una ruta del sitio (/...) o una URL https de un dominio permitido (no hay ninguno configurado).",
    });
  });
});

describe("parseCatalogOptionInput", () => {
  it("validates the slug of a genre or platform", () => {
    expect(parseCatalogOptionInput({ slug: "metroidvania", name: "Metroidvania" })).toEqual({
      slug: "metroidvania",
      name: "Metroidvania",
    });
    expect(fieldErrors(() => parseCatalogOptionInput({ slug: "Acción", name: "Acción" }))).toEqual({
      slug: "El slug sólo lleva minúsculas, números y guiones (por ejemplo ruta-9).",
    });
  });
});
