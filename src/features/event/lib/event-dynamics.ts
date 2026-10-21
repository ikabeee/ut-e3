import type { EventDynamic } from "@features/event/lib/types";

/** Carpeta pública con el arte de las dinámicas (`public/landing/dynamics/`). */
const DYNAMICS_IMAGES_PATH = "/landing/dynamics";

const image = (name: string) => `${DYNAMICS_IMAGES_PATH}/${name}`;

/**
 * Torneos y sorteo de la portada. Los horarios no se escriben aquí: salen de `EVENT_SCHEDULE`.
 * El número de juegos que pide el sorteo lo calcula la page con el catálogo real.
 */
export const EVENT_DYNAMICS: readonly EventDynamic[] = [
  {
    id: "kof",
    kind: "tournament",
    title: "Torneo KOF",
    format: "1 vs 1",
    players: 64,
    prize: "Premio al campeón",
    backgroundImage: image("kof-bg.webp"),
    layers: [
      { src: image("kof-logo.webp"), className: "left-[24.4%] top-[6.1%] h-[24.3%] w-[51.2%]" },
      { src: image("kof-fighter-left.webp"), className: "left-[4%] top-[21.6%] h-[78.4%] w-[46.2%] -scale-x-100" },
      { src: image("kof-fighter-right.webp"), className: "left-[37.3%] top-[27.7%] h-[71.3%] w-[52.8%]" },
    ],
  },
  {
    id: "smash",
    kind: "tournament",
    title: "Torneo Smash",
    format: "1 vs 1",
    players: 64,
    prize: "Premio para los 3 primeros",
    backgroundImage: image("smash-bg.webp"),
    layers: [
      { src: image("smash-logo.webp"), className: "left-[12.7%] top-[3.6%] h-[45.7%] w-[74.4%]" },
      { src: image("smash-mario.webp"), className: "left-[32.2%] top-[42.1%] h-[57.9%] w-[37.6%]" },
    ],
  },
  {
    id: "raffle",
    kind: "raffle",
    title: "Gran rifa",
    prize: "Premio para 30 personas",
  },
];
