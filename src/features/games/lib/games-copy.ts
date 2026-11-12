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
    allGenres: "Todos",
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
  notFound: {
    title: "Juego no encontrado",
    description:
      "Ese juego no está en el showcase: quizá cambió de nombre o el enlace está mal escrito. Estos sí te están esperando.",
  },
  standGame: {
    title: "Mi juego",
    description: "Registra los datos del juego de tu stand.",
    loading: "Cargando tu juego...",
    signedInAs: (name: string) => `Sesión de ${name}`,
    fields: {
      name: "Nombre del juego",
      synopsis: "Sinopsis",
      genre: "Género",
      itchUrl: "Enlace a itch.io (opcional)",
    },
    itchHint: "Se muestra a los visitantes a partir de la hora de activación del evento.",
    coverNote: "La portada y las imágenes las carga el sysadmin.",
    submit: "Guardar juego",
    pending: "Guardando...",
    outcomes: { created: "Juego registrado.", updated: "Juego actualizado." },
    errors: {
      nameRequired: "Escribe el nombre del juego (máximo 80 caracteres).",
      synopsisRequired: "Escribe la sinopsis (máximo 400 caracteres).",
      genreInvalid: "Elige un género de la lista.",
      itchInvalid: "El enlace debe ser una dirección https de itch.io.",
      conflict: "Otro cambio se guardó al mismo tiempo. Intenta de nuevo.",
    },
  },
  genresAdmin: {
    heading: "Catálogo de géneros",
    lead: "Los géneros que eligen los stands para su juego. Un género con juegos no se puede borrar.",
    newGenre: "Nuevo género",
    name: "Nombre",
    create: "Agregar género",
    rename: "Renombrar",
    pending: "Guardando...",
    gameCount: (count: number) => (count === 1 ? "1 juego" : `${count} juegos`),
    delete: "Borrar",
    confirmDelete: (name: string) => `¿Borrar el género ${name}?`,
    confirmDeleteAction: "Sí, borrar",
    cancel: "Cancelar",
    empty: "Aún no hay géneros.",
    outcomes: { created: "Género agregado.", renamed: "Género renombrado.", deleted: "Género borrado." },
    errors: {
      nameLength: "Escribe un nombre de 2 a 40 caracteres con letras (a-z, con o sin acento) o números.",
      taken: "Ya existe un género con ese nombre.",
      hasGames: "Ese género tiene juegos asignados: cámbialos de género antes de borrarlo.",
      notFound: "Ese género ya no existe. Recarga la página.",
    },
  },
};

function padTwoDigits(value: number): string {
  return String(value).padStart(2, "0");
}
