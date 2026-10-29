import { formatStandCode } from "@features/games/lib/stand-code";
import type { Game } from "@features/games/lib/types";

export const GAMES_COPY = {
  carousel: {
    roleDescription: "carrusel",
    slideRoleDescription: "diapositiva",
    label: "Juegos del showcase",
    previous: "Juego anterior",
    next: "Juego siguiente",
  },
  catalog: {
    heading: "Explora el catálogo",
    pageTitle: "Catálogo de juegos",
    pageDescription: "Explora los videojuegos del showcase por género o por stand y entra a la ficha de cada uno.",
    genresHeading: "Géneros",
    previousGenres: "Géneros anteriores",
    nextGenres: "Más géneros",
    gameCount: (count: number) => `${count} ${count === 1 ? "juego" : "juegos"}`,
    allGames: "Todos los juegos",
    searchLabel: "Buscar juegos",
    searchPlaceholder: "Busca un juego",
    // "4 de 18 juegos" or "2 de 18 juegos · Puzle".
    results: (visible: number, total: number, genreName: string | null) =>
      [`${visible} de ${total} juegos`, genreName].filter(Boolean).join(" · "),
    empty: "Ningún juego coincide con tu búsqueda.",
    showAll: "Ver todos los juegos",
  },
  coverflow: {
    label: "Juegos en el exhibidor",
    caseLabel: (game: Pick<Game, "name" | "genre" | "stand">) =>
      `${game.name}, ${game.genre.name}, stand ${formatStandCode(game.stand)}`,
    position: (current: number, count: number) => `${padTwoDigits(current + 1)} de ${padTwoDigits(count)}`,
  },
  detail: {
    backToCatalog: "Todos los juegos",
    meta: (game: Pick<Game, "genre" | "stand">) => `${game.genre.name} · ${formatStandCode(game.stand)}`,
    gallery: "Galería",
    galleryImages: "Imágenes del juego",
    image: (number: number) => `Imagen ${number}`,
    previousImage: "Imagen anterior",
    nextImage: "Imagen siguiente",
    tags: "Etiquetas",
    itchPending: (time: string) => `El enlace a itch.io se activa a las ${time}.`,
    itchOpen: "Jugar en itch.io",
  },
  labels: {
    genre: "Género",
    stand: "Stand",
    zone: "Zona",
    date: "Fecha",
    hours: "Horario",
    event: "Evento",
  },
  playLocation: {
    heading: "Dónde jugarlo",
    hoursRange: (start: string, end: string) => `${start} a ${end}`,
  },
  sidebar: {
    label: (name: string) => `Ficha de ${name}`,
    viewOnMap: "Ver en el croquis",
    attend: "Quiero asistir",
  },
  related: {
    heading: "Más juegos",
    seeAll: "Ver todos",
  },
};

function padTwoDigits(value: number): string {
  return String(value).padStart(2, "0");
}
