import { FLOOR_PLAN_SECTION_ID } from "@features/floor-plan/lib/floor-plan-links";
import { GAMES_PATH } from "@features/games/lib/games-links";
import { HOME_PATH } from "@features/landing/lib/landing-links";
import type { Discipline, StudioLink, Testimonial } from "@features/studio/lib/types";

/** The stacked cards of "Qué hacemos", in order of appearance. */
export const DISCIPLINES: Discipline[] = [
  {
    id: "design",
    eyebrow: "Pensamos",
    title: "Diseño",
    description:
      "Cada juego del E3 empieza en papel: reglas, ritmo y una idea clara de lo que debe sentir quien lo juega.",
    tags: ["Game design", "Narrativa", "Level design", "Prototipos", "Playtesting", "Balance"],
    cta: { label: "Ver juegos", href: GAMES_PATH },
    tone: "paper",
  },
  {
    id: "art",
    eyebrow: "Dibujamos",
    title: "Arte",
    description: "Personajes, mundos e interfaces creados por los equipos, del primer boceto al último sprite.",
    tags: ["Pixel art", "Modelado 3D", "Animación", "Interfaz", "Concept art"],
    cta: { label: "Ver juegos", href: GAMES_PATH },
    tone: "accent",
  },
  {
    id: "code",
    eyebrow: "Programamos",
    title: "Código",
    description: "Motores, físicas y redes que convierten cada idea en algo que se puede jugar en el stand.",
    tags: ["Unity", "Godot", "C#", "Shaders", "Multijugador", "Herramientas"],
    cta: { label: "Ver el croquis", href: `${HOME_PATH}#${FLOOR_PLAN_SECTION_ID}` },
    tone: "panel",
  },
  {
    id: "tournaments",
    eyebrow: "Competimos",
    title: "Torneos",
    description: "Torneo de KOF, Mario Kart y la rifa durante todo el día. Trae a tu equipo y compite.",
    tags: ["KOF", "Mario Kart", "Rifa", "Premios"],
    cta: { label: "Ver el evento", href: HOME_PATH },
    tone: "deep",
  },
];

/** How many skills a card shows before the "+N" counter. */
export const VISIBLE_TAGS = 3;

/**
 * SAMPLE DATA: replace them with real quotes (with permission of whoever says them) before publishing. Meanwhile
 * they are credited to a role, not to a person.
 */
export const TESTIMONIALS: Testimonial[] = [
  {
    id: "teacher",
    quote: "Ver a los equipos explicar su propio juego frente a cientos de personas es la mejor evaluación posible.",
    author: "Docente · Ejemplo",
    tilt: -4,
  },
  {
    id: "visitor",
    quote: "Entré por un torneo y terminé probando doce juegos. Ninguno se parecía al anterior.",
    author: "Visitante · Ejemplo",
    tilt: 3,
  },
  {
    id: "team",
    quote: "El showcase nos obligó a terminar. Llegar con una versión jugable cambió todo el proyecto.",
    author: "Equipo participante · Ejemplo",
    tilt: -2,
  },
];

export const CLOSING_LINKS: StudioLink[] = [
  { label: "Juegos", href: GAMES_PATH },
  { label: "Croquis", href: `${HOME_PATH}#${FLOOR_PLAN_SECTION_ID}` },
  { label: "Evento", href: HOME_PATH },
];
