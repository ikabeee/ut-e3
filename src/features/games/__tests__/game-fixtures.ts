import type { Game } from "@features/games/lib/types";

type GameFixtureInput = Pick<Game, "slug" | "name" | "genre" | "team" | "stand"> & Partial<Game>;

/** Completa un juego de prueba con valores neutros para lo que la prueba no necesita. */
export function makeGameFixture(game: GameFixtureInput): Game {
  const image = game.image ?? { src: `/games/${game.slug}.jpg`, alt: `Portada de ${game.name}`, position: null };

  return {
    members: 4,
    players: 1,
    description: `${game.name}, juego de prueba.`,
    about: null,
    platforms: ["Windows"],
    itchioUrl: null,
    gallery: [image],
    ...game,
    image,
  };
}

/**
 * Juegos de prueba de `games` y de las features que los muestran. Son independientes de los datos
 * del sitio (`lib/mock/` hoy, la base de datos después): agregar o cambiar un juego del catálogo no
 * rompe las pruebas, y borrar el mock no las deja sin datos.
 *
 * Cubren los casos que prueban: géneros con uno y dos juegos, juegos con encuadre propio, con varias
 * plataformas y con capturas, y textos con acentos para el buscador.
 */
export const GAME_FIXTURES: readonly Game[] = [
  makeGameFixture({
    slug: "ceniza-protocol",
    name: "Ceniza Protocol",
    genre: "Acción",
    team: "Equipo Grava",
    members: 5,
    stand: "A1",
    description: "Shooter de extracción en una ciudad sepultada por ceniza volcánica.",
    platforms: ["Windows", "Web (navegador)"],
    image: { src: "/games/ceniza-protocol.jpg", alt: "Portada de Ceniza Protocol", position: "70% 30%" },
  }),
  makeGameFixture({
    slug: "los-ultimos-faros",
    name: "Los Últimos Faros",
    genre: "Aventura",
    team: "Equipo Marea",
    stand: "A2",
    image: { src: "/games/los-ultimos-faros.jpg", alt: "Portada de Los Últimos Faros", position: "50% 30%" },
  }),
  makeGameFixture({
    slug: "hormigon",
    name: "Hormigón",
    genre: "Puzle",
    team: "Equipo Ocho",
    members: 3,
    stand: "A3",
  }),
  makeGameFixture({
    slug: "ruta-9",
    name: "Ruta 9",
    genre: "Carreras",
    team: "Equipo Ruido",
    stand: "A4",
    itchioUrl: "https://ruido.itch.io/ruta-9",
    image: { src: "/games/ruta-9.jpg", alt: "Portada de Ruta 9", position: "60% 35%" },
    gallery: [
      { src: "/games/ruta-9.jpg", alt: "Portada de Ruta 9", position: "60% 35%" },
      { src: "/games/ruta-9-pits.jpg", alt: "Ruta 9: entrada a pits", position: null },
    ],
  }),
  makeGameFixture({
    slug: "eco-nulo",
    name: "Eco/Nulo",
    genre: "Ritmo",
    team: "Equipo Señal",
    members: 3,
    stand: "B3",
    description: "Cada golpe en el ritmo borra una frecuencia del mapa.",
  }),
  makeGameFixture({
    slug: "pulso-cero",
    name: "Pulso Cero",
    genre: "Ritmo",
    team: "Equipo Bajo",
    stand: "A7",
    description: "Sincroniza tus saltos con el bajo para cruzar una ciudad apagada.",
  }),
  makeGameFixture({
    slug: "xibalba-run",
    name: "Xibalbá Run",
    genre: "Plataformas",
    team: "Equipo Ceiba",
    members: 5,
    stand: "A8",
  }),
  makeGameFixture({
    slug: "turbina",
    name: "Turbina",
    genre: "Carreras",
    team: "Equipo Pistón",
    stand: "A9",
    description: "Carreras de drones caseros por los techos de Cancún.",
  }),
  makeGameFixture({
    slug: "lucha-pixel",
    name: "Lucha Pixel",
    genre: "Pelea",
    team: "Equipo Máscara",
    members: 5,
    stand: "B7",
  }),
  makeGameFixture({ slug: "cenote", name: "Cenote", genre: "Aventura", team: "Equipo Raíz", members: 3, stand: "B8" }),
  makeGameFixture({
    slug: "circuito-7",
    name: "Circuito 7",
    genre: "Puzle",
    team: "Equipo Voltio",
    stand: "B9",
  }),
];
