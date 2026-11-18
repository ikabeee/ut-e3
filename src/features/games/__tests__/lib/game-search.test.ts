import { searchGames, type GameSearchFields } from "@features/games/lib/game-search";

interface Item {
  slug: string;
  name: string;
  genreName: string;
}

const SAATAL_PAAL: Item = { slug: "saatan-paal", name: "Saatal Paal", genreName: "Sigilo" };

const SANTUARIO: Item = { slug: "santuario", name: "Santuario", genreName: "Acción" };

const TURNO_ROSSO: Item = { slug: "turno-rosso", name: "Turno Rosso", genreName: "Simulación" };

const SOMBRA: Item = { slug: "sombra-del-mictlan", name: "Sombra del Mictlán", genreName: "RPG" };

function namesFor(items: Item[], keyword: string): string[] {
  return searchGames(items, keyword, toFields).map((item) => item.name);
}

function toFields(item: Item): GameSearchFields {
  return item;
}

describe("searchGames (S21)", () => {
  it('finds "Saatal Paal" for "san" through its slug saatan-paal', () => {
    expect(namesFor([TURNO_ROSSO, SAATAL_PAAL, SOMBRA], "san")).toEqual(["Saatal Paal"]);
  });

  it("returns every game in its order for a blank keyword", () => {
    expect(namesFor([TURNO_ROSSO, SAATAL_PAAL], "   ")).toEqual(["Turno Rosso", "Saatal Paal"]);
  });

  it("ignores accents and case in the name, the slug and the genre", () => {
    expect(namesFor([SOMBRA, TURNO_ROSSO], "MICTLAN")).toEqual(["Sombra del Mictlán"]);
    expect(namesFor([SOMBRA, TURNO_ROSSO], "simulacion")).toEqual(["Turno Rosso"]);
    expect(namesFor([SOMBRA, TURNO_ROSSO], "turno-ros")).toEqual(["Turno Rosso"]);
  });

  it("lists the games that contain the text before the ones that only have its letters in order", () => {
    expect(namesFor([SAATAL_PAAL, SANTUARIO], "san")).toEqual(["Santuario", "Saatal Paal"]);
  });

  it("keeps the letters-in-order match inside one word that starts with the same letter and is not much longer", () => {
    expect(namesFor([TURNO_ROSSO], "sin")).toEqual([]);
    expect(namesFor([SAATAL_PAAL], "sl")).toEqual([]);
    expect(namesFor([SAATAL_PAAL], "aan")).toEqual([]);
    expect(namesFor([SOMBRA], "sma")).toEqual(["Sombra del Mictlán"]);
  });

  it("matches every word of a keyword with several words", () => {
    expect(namesFor([SAATAL_PAAL, SOMBRA], "san paal")).toEqual(["Saatal Paal"]);
    expect(namesFor([SAATAL_PAAL, SOMBRA], "san rpg")).toEqual([]);
  });
});
