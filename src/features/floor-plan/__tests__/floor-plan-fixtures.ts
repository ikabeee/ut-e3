import type { FloorPlanStand } from "@features/floor-plan/lib/types";

export const STAND_FIXTURES: readonly FloorPlanStand[] = [
  {
    code: "zA-s1",
    name: "Ceniza Protocol",
    genre: "Acción",
    synopsis: "Shooter de extracción en una ciudad sepultada por ceniza volcánica.",
    coverSrc: "/games/ceniza-protocol.jpg",
    coverAlt: "Portada de Ceniza Protocol",
  },
  {
    code: "zA-s3",
    name: "Hormigón",
    genre: "Puzle",
    synopsis: "Vierte, fragua y apila concreto para construir torres imposibles.",
    coverSrc: "/games/hormigon.jpg",
    coverAlt: "Portada de Hormigón",
  },
  {
    code: "zB-s2",
    name: "Kaiju Mercado",
    genre: "Simulación",
    synopsis: "Administra un tianguis donde los clientes miden treinta metros.",
    coverSrc: "/games/kaiju-mercado.jpg",
    coverAlt: "Portada de Kaiju Mercado",
  },
];
