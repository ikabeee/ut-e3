import type { StandZone, ZoneId } from "@features/floor-plan/lib/types";

interface ZoneCopy {
  kind: string;
  title: string;
  description: string;
}

const HELP_CENTER: Omit<ZoneCopy, "title"> = {
  kind: "Atención",
  description: "Dudas, uso de la PWA, rifa y orientación.",
};

const ZONES: Record<ZoneId, ZoneCopy> = {
  stage: {
    kind: "Escenario",
    title: "Escenario principal",
    description: "Inauguración, tercer lugar y final de KOF, presentación de ganadores y rifa.",
  },
  kof: {
    kind: "Actividades",
    title: "Arena KOF",
    description: "4 tableros de 16 jugadores. El tercer lugar y la final se juegan en el escenario principal.",
  },
  "mario-kart": {
    kind: "Actividades",
    title: "Mario Kart",
    description: "Partidas abiertas, solo informativo.",
  },
  restrooms: { kind: "Servicios", title: "Baños", description: "Baños generales y accesibles." },
  marketplace: {
    kind: "Servicios",
    title: "Marketplace central",
    description: "Mercado local frente al Monumento a la Paz.",
  },
  "help-center-1": { ...HELP_CENTER, title: "Centro de atención 1" },
  "help-center-2": { ...HELP_CENTER, title: "Centro de atención 2" },
  "help-center-3": { ...HELP_CENTER, title: "Centro de atención 3" },
  "help-center-4": { ...HELP_CENTER, title: "Centro de atención 4" },
};

const BLOCK_LABELS: Record<StandZone, string> = {
  A: "Bloque A",
  B: "Bloque B",
  C: "Bloque C",
  D: "Bloque D",
  T: "Bloque T",
};

const ZONE_DRAWING_LABELS: Record<ZoneId, string> = {
  stage: "Escenario",
  kof: "Arena KOF",
  "mario-kart": "Mario Kart",
  restrooms: "Baños",
  marketplace: "Marketplace central",
  "help-center-1": "Info",
  "help-center-2": "Info",
  "help-center-3": "Info",
  "help-center-4": "Info",
};

export const FLOOR_PLAN_COPY = {
  heading: "Croquis",
  mapLabel: "Croquis del Edificio B con zonas y stands",
  detailLabel: "Detalle del croquis",
  compactHint: "Pellizca o toca + para ver los juegos",
  sectionLink: "Abrir el croquis",
  zones: ZONES,
  unassignedTitle: "Stand por asignar",
  unassignedDescription: "Este stand todavía no tiene un juego asignado.",
  drawing: {
    zoneLabels: ZONE_DRAWING_LABELS,
    blockLabels: BLOCK_LABELS,
    standLabel: (code: string, title?: string) => (title ? `Stand ${code}, ${title}` : `Stand ${code}`),
  },
  standKicker: (code: string, kind: string) => `Stand ${code} · ${kind}`,
  unassignedKicker: (code: string) => `Stand ${code}`,
  blockLine: (blockLabel: string, number: number, size: number) => `${blockLabel} · stand ${number} de ${size}`,
  filters: {
    groupLabel: "Filtrar marcadores",
    all: "Todos",
    stands: "Stands",
    activities: "Actividades",
    services: "Servicios",
    chipLabel: (label: string, count: number) => `${label} ${count}`,
  },
  controls: {
    groupLabel: "Controles del mapa",
    zoomIn: "Acercar",
    zoomOut: "Alejar",
    recenter: "Centrar el mapa",
  },
  list: {
    show: "Ver como lista",
    hide: "Ocultar lista",
  },
  legend: {
    label: "Simbología",
    entries: ["Stand", "Actividad o servicio", "Zona"],
  },
  detail: {
    close: "Cerrar detalle",
    dismiss: "Cerrar",
    gameLink: "Ver ficha del juego",
  },
  page: {
    kicker: (siteName: string, building: string, shortName: string) => `${siteName} · ${building}, ${shortName}`,
    lead: (building: string) =>
      `Ubica cada stand, las actividades y los servicios del ${building}. Toca un marcador para ver el juego.`,
    summary: (stands: number, blocks: number, activities: number) =>
      `${stands} stands · ${blocks} bloques · ${activities} actividades`,
    description: (building: string) =>
      `Mapa del ${building} con los stands, las actividades y los servicios del evento.`,
  },
} as const;
