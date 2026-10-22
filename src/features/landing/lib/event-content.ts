import { buildGoogleCalendarUrl, formatVenueAddress } from "@features/landing/lib/event-format";
import type { EventDynamic, EventInfo, EventVenue, ScheduleEntry } from "@features/landing/lib/types";
import { siteConfig } from "@shared/lib/site-config";

/**
 * Contenido editable del evento. Es el único lugar donde se escriben la sede, la fecha, el
 * programa y las dinámicas: las etiquetas de la portada y el enlace de Google Calendar salen de aquí.
 */
export const EVENT_VENUE: EventVenue = {
  name: "Universidad Tecnológica de Cancún",
  shortName: "UT Cancún",
  streetAddress: "Carretera Cancún–Aeropuerto, Km 11.5, S.M. 299, Mz. 5, Lt. 1",
  locality: "Cancún",
  region: "Quintana Roo",
  postalCode: "77565",
  country: "MX",
};

// Fecha y horario del evento (hora de Cancún, UTC-5).
const name = "UTG · Showcase de videojuegos";

const startsAt = "2026-11-20T10:00:00-05:00";

const endsAt = "2026-11-20T20:00:00-05:00";

const admission = "Entrada libre";

export const EVENT_INFO: EventInfo = {
  name,
  startsAt,
  endsAt,
  admission,
  calendarUrl: buildGoogleCalendarUrl({
    title: name,
    startsAt,
    endsAt,
    details: `Showcase de videojuegos de la ${siteConfig.organization.division}. ${admission}.`,
    location: formatVenueAddress(EVENT_VENUE),
  }),
};

/** Programa del día. */
export const EVENT_SCHEDULE: readonly ScheduleEntry[] = [
  { time: "10:00", title: "Apertura", place: "Entrada" },
  { time: "10:30", title: "Presentación de los equipos", place: "Main Stage" },
  { time: "12:00", title: "Cierre de inscripciones a torneos", place: "Arena de torneos" },
  { time: "13:00", title: "Primer sorteo", place: "Main Stage" },
  { time: "13:30", title: "Rondas de torneos", place: "Arena de torneos" },
  { time: "16:00", title: "Segundo sorteo", place: "Main Stage" },
  { time: "17:00", title: "Finales de torneos", place: "Main Stage" },
  { time: "19:00", title: "Sorteo final y premiación", place: "Main Stage" },
  { time: "20:00", title: "Cierre", place: "Entrada" },
];

/** Carpeta pública con el arte de las dinámicas (`public/landing/dynamics/`). */
const DYNAMICS_IMAGES_PATH = "/landing/dynamics";

const image = (fileName: string) => `${DYNAMICS_IMAGES_PATH}/${fileName}`;

/** Torneos y sorteo de la portada. El número de juegos que pide el sorteo lo pasa la page. */
export const EVENT_DYNAMICS: readonly EventDynamic[] = [
  {
    id: "kof",
    kind: "tournament",
    title: "Torneo KOF",
    format: "1 VS 1",
    players: 64,
    prize: "Premio al campeón",
    backgroundImage: image("kof-bg.webp"),
    cardClassName: "aspect-[606/408] rounded-[34.5px]",
    layers: [
      { src: image("kof-logo.webp"), className: "left-[24.4%] top-[6.1%] h-[24.3%] w-[51.2%]" },
      { src: image("kof-fighter-left.webp"), className: "left-[4%] top-[21.6%] h-[78.4%] w-[46.2%] -scale-x-100" },
      {
        src: image("kof-fighter-right.webp"),
        className: "left-[37.3%] top-[27.7%] h-[71.3%] w-[52.8%]",
        imageClassName: "object-[36%_0%]",
      },
    ],
  },
  {
    id: "smash",
    kind: "tournament",
    title: "Torneo Smash",
    format: "1 VS 1",
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
