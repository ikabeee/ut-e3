import { splitParagraphs, toGame, type GameRow } from "@features/games/lib/game-mapping";

const row: GameRow = {
  slug: "ruta-9",
  name: "Ruta 9",
  description: "Carreras arcade nocturnas.",
  about: null,
  players: 2,
  itchioUrl: "https://ruido.itch.io/ruta-9",
  team: { name: "Equipo Ruido", standCode: "A4", members: 4 },
  genre: { name: "Carreras" },
  platforms: [{ platform: { name: "Windows" } }, { platform: { name: "Android" } }],
  images: [
    { imageUrl: "/mock/games/shot-2.jpg", altText: "Captura 2", cropPosition: null, isCover: false, sortOrder: 2 },
    { imageUrl: "/mock/games/ruta-9.jpg", altText: "Portada", cropPosition: "60% 35%", isCover: true, sortOrder: 0 },
    { imageUrl: "/mock/games/shot-1.jpg", altText: "Captura 1", cropPosition: null, isCover: false, sortOrder: 1 },
  ],
};

describe("toGame", () => {
  it("maps the row to the Game shown on the site", () => {
    expect(toGame(row)).toMatchObject({
      slug: "ruta-9",
      genre: "Carreras",
      team: "Equipo Ruido",
      members: 4,
      players: 2,
      stand: "A4",
      about: null,
      itchioUrl: "https://ruido.itch.io/ruta-9",
      image: { src: "/mock/games/ruta-9.jpg", alt: "Portada", position: "60% 35%" },
    });
  });

  it("puts the cover first and the screenshots in order", () => {
    expect(toGame(row)?.gallery.map((image) => image.alt)).toEqual(["Portada", "Captura 1", "Captura 2"]);
  });

  it("sorts the platforms by name", () => {
    expect(toGame(row)?.platforms).toEqual(["Android", "Windows"]);
  });

  it("keeps a team without stand", () => {
    expect(toGame({ ...row, team: { name: "Equipo Ruido", standCode: null, members: 4 } })?.stand).toBeNull();
  });

  it("hides a game without cover", () => {
    expect(toGame({ ...row, images: row.images.filter((image) => !image.isCover) })).toBeNull();
  });
});

describe("splitParagraphs", () => {
  it("splits the text of 'Acerca del juego' on blank lines", () => {
    expect(splitParagraphs("Primer párrafo.\n\n  Segundo\npárrafo.  \n \n")).toEqual([
      "Primer párrafo.",
      "Segundo\npárrafo.",
    ]);
  });

  it("returns null when there is no text", () => {
    expect(splitParagraphs(null)).toBeNull();
    expect(splitParagraphs("  \n\n ")).toBeNull();
  });
});
