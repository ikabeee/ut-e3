import "server-only";
import type { Game, Genre } from "@features/games/lib/types";

const GENRES = {
  accion: { id: "accion", name: "Acción", slug: "accion" },
  aventura: { id: "aventura", name: "Aventura", slug: "aventura" },
  puzle: { id: "puzle", name: "Puzle", slug: "puzle" },
  carreras: { id: "carreras", name: "Carreras", slug: "carreras" },
  roguelike: { id: "roguelike", name: "Roguelike", slug: "roguelike" },
  simulacion: { id: "simulacion", name: "Simulación", slug: "simulacion" },
  ritmo: { id: "ritmo", name: "Ritmo", slug: "ritmo" },
  metroidvania: { id: "metroidvania", name: "Metroidvania", slug: "metroidvania" },
  estrategia: { id: "estrategia", name: "Estrategia", slug: "estrategia" },
  arcade: { id: "arcade", name: "Arcade", slug: "arcade" },
  plataformas: { id: "plataformas", name: "Plataformas", slug: "plataformas" },
  sigilo: { id: "sigilo", name: "Sigilo", slug: "sigilo" },
  pelea: { id: "pelea", name: "Pelea", slug: "pelea" },
} satisfies Record<string, Genre>;

type GameFields = Pick<Game, "slug" | "name" | "genre" | "synopsis" | "stand">;

export const INITIAL_GAMES: Game[] = [
  buildGame({
    slug: "ceniza-protocol",
    name: "Ceniza Protocol",
    genre: GENRES.accion,
    synopsis: "Shooter de extracción en una ciudad sepultada por ceniza volcánica.",
    stand: { zone: "A", number: 1 },
  }),
  buildGame({
    slug: "los-ultimos-faros",
    name: "Los Últimos Faros",
    genre: GENRES.aventura,
    synopsis: "Mantén encendido el último faro del Caribe mientras la marea cambia la isla cada noche.",
    stand: { zone: "A", number: 2 },
  }),
  buildGame({
    slug: "hormigon",
    name: "Hormigón",
    genre: GENRES.puzle,
    synopsis: "Vierte, fragua y apila concreto para construir torres imposibles.",
    stand: { zone: "A", number: 3 },
  }),
  buildGame({
    slug: "ruta-9",
    name: "Ruta 9",
    genre: GENRES.carreras,
    synopsis: "Carreras arcade nocturnas sobre periféricos que nunca terminan.",
    stand: { zone: "A", number: 4 },
  }),
  buildGame({
    slug: "subsuelo",
    name: "Subsuelo",
    genre: GENRES.roguelike,
    synopsis: "Desciende por cenotes y galerías que cambian en cada partida.",
    stand: { zone: "B", number: 1 },
  }),
  buildGame({
    slug: "kaiju-mercado",
    name: "Kaiju Mercado",
    genre: GENRES.simulacion,
    synopsis: "Administra un tianguis donde los clientes miden treinta metros.",
    stand: { zone: "B", number: 2 },
  }),
  buildGame({
    slug: "eco-nulo",
    name: "Eco/Nulo",
    genre: GENRES.ritmo,
    synopsis: "Cada golpe en el ritmo borra una frecuencia del mapa.",
    stand: { zone: "B", number: 3 },
  }),
  buildGame({
    slug: "templo-404",
    name: "Templo 404",
    genre: GENRES.metroidvania,
    synopsis: "Explora un templo que se corrompe como un archivo dañado.",
    stand: { zone: "B", number: 4 },
  }),
  buildGame({
    slug: "marea-roja",
    name: "Marea Roja",
    genre: GENRES.estrategia,
    synopsis: "Defiende el arrecife de una marea tóxica colocando torres de coral.",
    stand: { zone: "A", number: 5 },
  }),
  buildGame({
    slug: "neon-taqueria",
    name: "Neón Taquería",
    genre: GENRES.arcade,
    synopsis: "Atiende pedidos imposibles en una taquería que nunca cierra.",
    stand: { zone: "A", number: 6 },
  }),
  buildGame({
    slug: "pulso-cero",
    name: "Pulso Cero",
    genre: GENRES.ritmo,
    synopsis: "Sincroniza tus saltos con el bajo para cruzar una ciudad apagada.",
    stand: { zone: "A", number: 7 },
  }),
  buildGame({
    slug: "xibalba-run",
    name: "Xibalbá Run",
    genre: GENRES.plataformas,
    synopsis: "Corre por el inframundo maya antes de que se cierre la última puerta.",
    stand: { zone: "A", number: 8 },
  }),
  buildGame({
    slug: "turbina",
    name: "Turbina",
    genre: GENRES.carreras,
    synopsis: "Carreras de drones caseros por los techos de Cancún.",
    stand: { zone: "A", number: 9 },
  }),
  buildGame({
    slug: "sombra-jade",
    name: "Sombra Jade",
    genre: GENRES.sigilo,
    synopsis: "Infíltrate en un museo para recuperar una máscara robada.",
    stand: { zone: "B", number: 5 },
  }),
  buildGame({
    slug: "granja-orbital",
    name: "Granja Orbital",
    genre: GENRES.simulacion,
    synopsis: "Cultiva nopales en gravedad cero y abastece una estación espacial.",
    stand: { zone: "B", number: 6 },
  }),
  buildGame({
    slug: "lucha-pixel",
    name: "Lucha Pixel",
    genre: GENRES.pelea,
    synopsis: "Lucha libre en 2D con llaves que se arman como combos.",
    stand: { zone: "B", number: 7 },
  }),
  buildGame({
    slug: "cenote",
    name: "Cenote",
    genre: GENRES.aventura,
    synopsis: "Explora cenotes inundados y descubre lo que guardan sus paredes.",
    stand: { zone: "B", number: 8 },
  }),
  buildGame({
    slug: "circuito-7",
    name: "Circuito 7",
    genre: GENRES.puzle,
    synopsis: "Conecta circuitos antes de que se acabe la batería del robot.",
    stand: { zone: "B", number: 9 },
  }),
];

function buildGame(fields: GameFields): Game {
  return {
    ...fields,
    id: fields.slug,
    images: [{ path: `/games/${fields.slug}.jpg`, alt: `Portada de ${fields.name}`, position: 0, isCover: true }],
    itchUrl: null,
  };
}
