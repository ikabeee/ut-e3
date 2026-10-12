import type { Game } from "@features/games/lib/types";

type GameFixtureInput = Pick<Game, "slug" | "name" | "genre" | "team" | "stand"> & Partial<Game>;

/** Completa un juego de prueba con valores neutros para lo que la prueba no necesita. */
export function makeGameFixture(game: GameFixtureInput): Game {
  return {
    members: 4,
    players: 1,
    hasTournament: false,
    description: `${game.name}, juego de prueba.`,
    about: null,
    image: null,
    art: { seed: 0, palette: ["acid", "black"] },
    ...game,
  };
}

/**
 * Juegos de prueba de `games` y de las features que los muestran. Son independientes de los datos
 * del sitio (`lib/mock/` hoy, la base de datos después): agregar o cambiar un juego del catálogo no
 * rompe las pruebas, y borrar el mock no las deja sin datos.
 *
 * Cubren los casos que prueban: géneros con uno y dos juegos, juegos con y sin imagen, con y sin
 * torneo, y textos con acentos para el buscador.
 */
export const GAME_FIXTURES: readonly Game[] = [
  makeGameFixture({
    slug: "ceniza-protocol",
    name: "Ceniza Protocol",
    genre: "Acción",
    team: "Equipo Grava",
    members: 5,
    stand: "A1",
    hasTournament: true,
    description: "Shooter de extracción en una ciudad sepultada por ceniza volcánica.",
    image: { src: "/mock/games/ceniza-protocol.jpg", position: "70% 30%" },
  }),
  makeGameFixture({
    slug: "los-ultimos-faros",
    name: "Los Últimos Faros",
    genre: "Aventura",
    team: "Equipo Marea",
    stand: "A2",
    image: { src: "/mock/games/los-ultimos-faros.jpg", position: "50% 30%" },
    art: { seed: 1, palette: ["white", "panel"] },
  }),
  makeGameFixture({
    slug: "hormigon",
    name: "Hormigón",
    genre: "Puzle",
    team: "Equipo Ocho",
    members: 3,
    stand: "A3",
    art: { seed: 2, palette: ["black", "light"] },
  }),
  makeGameFixture({
    slug: "ruta-9",
    name: "Ruta 9",
    genre: "Carreras",
    team: "Equipo Ruido",
    stand: "A4",
    hasTournament: true,
    image: { src: "/mock/games/ruta-9.jpg", position: "60% 35%" },
    art: { seed: 3, palette: ["acid", "panel"] },
  }),
  makeGameFixture({
    slug: "eco-nulo",
    name: "Eco/Nulo",
    genre: "Ritmo",
    team: "Equipo Señal",
    members: 3,
    stand: "B3",
    hasTournament: true,
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
    hasTournament: true,
  }),
  makeGameFixture({
    slug: "turbina",
    name: "Turbina",
    genre: "Carreras",
    team: "Equipo Pistón",
    stand: "A9",
    hasTournament: true,
    description: "Carreras de drones caseros por los techos de Cancún.",
  }),
  makeGameFixture({
    slug: "lucha-pixel",
    name: "Lucha Pixel",
    genre: "Pelea",
    team: "Equipo Máscara",
    members: 5,
    stand: "B7",
    hasTournament: true,
  }),
  makeGameFixture({ slug: "cenote", name: "Cenote", genre: "Aventura", team: "Equipo Raíz", members: 3, stand: "B8" }),
  makeGameFixture({
    slug: "circuito-7",
    name: "Circuito 7",
    genre: "Puzle",
    team: "Equipo Voltio",
    stand: "B9",
    art: { seed: 17, palette: ["acid", "panel"] },
  }),
];
