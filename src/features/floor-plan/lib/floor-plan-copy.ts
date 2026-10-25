import type { PlanCategory, StandZone, ZoneId } from "@features/floor-plan/lib/types";
import { siteConfig } from "@shared/lib/site-config";

interface ZoneCopy {
  kind: string;
  title: string;
  description: string;
}

interface InfoBoothCopy {
  title: string;
  description: string;
}

const { division, universityShortName } = siteConfig.organization;

const ZONES: Record<ZoneId, ZoneCopy> = {
  stage: {
    kind: "Escenario",
    title: "Escenario principal",
    description: "Pláticas de las invitadas especiales y la rifa.",
  },
  kof: {
    kind: "Actividades",
    title: "Arena KOF",
    description: "4 tableros de 16 jugadores y un tablero para las semifinales y la final.",
  },
  "mario-kart": {
    kind: "Actividades",
    title: "Mario Kart",
    description: "Partidas abiertas, solo informativo.",
  },
  marketplace: {
    kind: "Servicios",
    title: "Marketplace",
    description: "Mercado local.",
  },
  "help-desk": {
    kind: "Servicios",
    title: "Atención",
    description: "Información y recuperación del pasaporte.",
  },
  restrooms: { kind: "Servicios", title: "Baños", description: "Baños generales y accesibles." },
  "rest-area": { kind: "Servicios", title: "Descanso", description: "Zona con sombra y asientos." },
  entrance: { kind: "Acceso", title: "Entrada", description: "Entrada libre, sin registro ni boleto." },
};

const INFO_BOOTHS: readonly InfoBoothCopy[] = [
  {
    title: "Ingeniería y Tecnologías",
    description: `Stand de la ${division}. Conoce las carreras y los proyectos de la división.`,
  },
  {
    title: "Inscripción al torneo de KOF",
    description: "Consulta las bases y los horarios del torneo.",
  },
  {
    title: "Oferta educativa",
    description: `Información sobre las carreras y el proceso de admisión de la ${universityShortName}.`,
  },
  {
    title: "Patrocinadores",
    description: "Stand de las marcas que apoyan el evento y sus premios.",
  },
];

const CATEGORY_LABELS: Record<PlanCategory, string> = {
  team: "Stand de equipo",
  info: "Stand informativo",
  act: "Escenario y actividades",
  srv: "Servicios",
};

const AISLE_NAMES: Record<StandZone, string> = { A: "Pasillo A", B: "Pasillo B", C: "Pasillo central" };

const ZONE_DRAWING_LABELS: Record<ZoneId, string> = {
  stage: "Escenario",
  kof: "Arena KOF",
  "mario-kart": "Mario Kart",
  marketplace: "Marketplace",
  "help-desk": "Info",
  restrooms: "WC",
  "rest-area": "Descanso",
  entrance: "Entrada",
};

export const FLOOR_PLAN_COPY = {
  heading: "Croquis",
  mapLabel: "Croquis del evento con zonas y stands",
  zones: ZONES,
  infoBooths: INFO_BOOTHS,
  categoryLabels: CATEGORY_LABELS,
  infoStandKind: "Informativo",
  unassignedTitle: "Stand por asignar",
  unassignedDescription: "Este stand todavía no tiene un juego asignado.",
  drawing: {
    publicArea: "Público",
    entry: "Entrada",
    zoneLabels: ZONE_DRAWING_LABELS,
    aisleNames: AISLE_NAMES,
    standLabel: (code: string, title?: string) => (title ? `Stand ${code}, ${title}` : `Stand ${code}`),
  },
  standKicker: (code: string, kind: string) => `Stand ${code} · ${kind}`,
  unassignedKicker: (code: string) => `Stand ${code}`,
} as const;
