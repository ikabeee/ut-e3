/** Equipos del evento. Es el único lugar donde se escribe: el conteo, el contador "n/total" y la rifa lo leen. */
export const LANDING_TEAM_COUNT = 18;

export interface LandingGame {
  id: string;
  name: string;
  genre: string;
  description: string;
  /** Personaje de la tarjeta; sobresale por arriba de ella. `className` lo coloca como en el Figma (en % de la tarjeta). */
  image: { src: string; width: number; height: number; className: string };
}

const GENRE = "Plataformas";
const DESCRIPTION = "Sincroniza tus saltos con el bajo para cruzar una ciudad apagada.";

/** Tarjetas del carrusel tal como las muestra el Figma. Son de relleno: no vienen de la base de datos. */
export const LANDING_GAMES: readonly LandingGame[] = [
  {
    id: "game-1",
    name: "Videojuego 1",
    genre: GENRE,
    description: DESCRIPTION,
    image: {
      src: "/landing/games/mario.webp",
      width: 567,
      height: 781,
      className: "-top-[28.2%] left-[8.3%] w-[57.7%]",
    },
  },
  {
    id: "game-2",
    name: "Videojuego 2",
    genre: GENRE,
    description: DESCRIPTION,
    image: {
      src: "/landing/games/clash.webp",
      width: 536,
      height: 587,
      className: "-top-[33.3%] left-[7.2%] w-[72.8%]",
    },
  },
  {
    id: "game-3",
    name: "Videojuego 3",
    genre: GENRE,
    description: DESCRIPTION,
    image: {
      src: "/landing/games/hollow-knight.webp",
      width: 310,
      height: 360,
      className: "-top-[34.9%] left-[5.1%] w-[65.8%]",
    },
  },
];
