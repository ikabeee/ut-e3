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
