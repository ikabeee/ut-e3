import type { Game } from "@features/games/lib/types";
import { siteConfig } from "@shared/lib/site-config";
import { padTwoDigits, pluralize } from "@shared/lib/text";

const { division, universityShortName } = siteConfig.organization;

/**
 * Textos de la interfaz de `games`. Los que dependen de un dato (horarios, organización,
 * cantidades) son funciones: el dato se pasa o se lee de su único dueño, nunca se escribe aquí.
 */
export const GAMES_COPY = {
  /** Lo que se muestra en lugar del stand mientras el equipo no tiene uno asignado. */
  unassignedStand: "Por asignar",
  carousel: {
    roleDescription: "carrusel",
    label: "Juegos del showcase",
    previous: "Juego anterior",
    next: "Juego siguiente",
  },
  coverflow: {
    label: "Juegos en el exhibidor",
    /** Nombre accesible de cada caja: "Ruta 9, Carreras, stand A4" (o "stand por asignar"). */
    caseLabel: (game: Pick<Game, "name" | "genre" | "stand">) =>
      `${game.name}, ${game.genre}, stand ${game.stand ?? "por asignar"}`,
    /** Posición para lectores de pantalla: "09 de 18". */
    position: (current: number, count: number) => `${padTwoDigits(current + 1)} de ${padTwoDigits(count)}`,
  },
  catalog: {
    genresHeading: "Géneros",
    previousGenres: "Géneros anteriores",
    nextGenres: "Más géneros",
    gameCount: (count: number) => `${count} ${pluralize(count, "juego", "juegos")}`,
    allGames: "Todos los juegos",
    searchLabel: "Buscar juegos",
    searchPlaceholder: "Busca un juego",
    /** Contador: "4 de 18 juegos" o "2 de 18 juegos · Puzle". */
    results: (visible: number, total: number, genre: string | null) => {
      const count = `${visible} de ${total} juegos`;

      return genre === null ? count : `${count} · ${genre}`;
    },
    empty: "Ningún juego coincide con tu búsqueda.",
    showAll: "Ver todos los juegos",
  },
  detail: {
    backToCatalog: "← Todos los juegos",
    teamAndStand: (game: Pick<Game, "team" | "stand">) => `${game.team} · Stand ${game.stand ?? "por asignar"}`,
    sectionsLabel: "Secciones del juego",
    overviewTab: "Información general",
    gallery: "Galería",
    previousImage: "Imagen anterior",
    nextImage: "Imagen siguiente",
    images: "Imágenes",
    image: (position: number) => `Imagen ${position}`,
    genre: "Género",
    features: "Características",
    aboutHeading: "Acerca del juego",
    /** Párrafo de "Acerca del juego" cuando el juego no trae el suyo (`Game.about`). */
    about: (game: Pick<Game, "name" | "team" | "members">) =>
      `${game.name} es el proyecto de ${game.team}, ${game.members} estudiantes de la ${division} de la ${universityShortName}. En el evento vas a poder jugar una demo de unos 10 minutos y platicar con el equipo sobre cómo lo hicieron.`,
    playLocationHeading: "Dónde jugarlo",
    playLocation: { stand: "Stand", aisle: "Pasillo", date: "Fecha", hours: "Horario" },
    relatedHeading: "Más juegos",
    seeAll: "Ver todos ↗",
  },
  sidebar: {
    viewOnMap: "Ver en el croquis",
    playOnItchio: "Jugar en itch.io",
    attend: "Quiero asistir",
  },
  features: {
    demo: "Demo jugable",
    players: (players: number) => (players === 1 ? "Un jugador" : `${players} jugadores`),
  },
  facts: {
    team: "Equipo",
    members: "Integrantes",
    genre: "Género",
    stand: "Stand",
    event: "Evento",
  },
} as const;
