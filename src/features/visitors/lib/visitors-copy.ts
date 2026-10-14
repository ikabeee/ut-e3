import type { TrafficLevel } from "@features/visitors/lib/stand-traffic";
import { pluralize } from "@shared/lib/text";

/** "1 juego" / "3 juegos". */
const gameCount = (count: number) => `${count} ${pluralize(count, "juego", "juegos")}`;

/** "Te falta 1 juego por probar" / "Te faltan 3 juegos por probar". */
const missingGames = (count: number) => `Te ${pluralize(count, "falta", "faltan")} ${gameCount(count)} por probar`;

const TRAFFIC_LEVELS: Record<TrafficLevel, string> = {
  low: "Sin fila",
  medium: "Afluencia media",
  high: "Mucha afluencia",
};

/**
 * Textos de la interfaz de `visitors`: pasaporte, registro, sorteo y afluencia de los stands.
 * Los que dependen de un dato (cantidades, gamertag, fecha) son funciones.
 */
export const VISITORS_COPY = {
  page: {
    title: "Pasaporte",
    description: "Tu QR del showcase: registra los juegos que pruebas y obtén tu boleto para el sorteo.",
  },
  header: {
    kicker: (eventDateLabel: string) => `Showcase · ${eventDateLabel}`,
    title: "Pasaporte",
    intro:
      "Prueba los juegos de todos los stands. Cada equipo escanea tu QR cuando juegas su demo y, cuando completes el pasaporte, obtienes un boleto para el sorteo del main stage.",
  },
  registration: {
    title: "Obtén tu código de acceso",
    intro:
      "Ingresa tu nombre y correo para recibir tu código personal. Te enviaremos una copia a tu correo y, al completar todos los juegos, recibirás tu número para el sorteo.",
    unknownQrTitle: "Ese código ya no es válido",
    unknownQrDescription:
      "Si ya te habías registrado, pide ayuda en el módulo de información para recuperar tu pasaporte.",
    fullNameLabel: "Nombre completo",
    fullNamePlaceholder: "ej. Sofía Martínez",
    emailLabel: "Correo electrónico",
    emailPlaceholder: "ej. smartinez@correo.com",
    emailHint: "Aquí te enviaremos una copia de tu código y tu boleto del sorteo.",
    gamertagLabel: "Nombre de usuario (opcional)",
    gamertagPlaceholder: "sofiagamer",
    gamertagHint: "De 3 a 24 caracteres sin espacios. Si lo dejas vacío, se generará a partir de tu nombre.",
    submit: "Comenzar recorrido",
  },
  qr: {
    kicker: "Tu QR personal",
    label: (gamertag: string) => `Código QR de ${gamertag}`,
    instructions: "Muéstralo en cada stand para que el equipo lo escanee.",
    screenshotTip: "Toma una captura de pantalla",
    screenshotReason:
      ": funciona sin internet y, si tu navegador borra sus datos, abrirla te devuelve a este pasaporte.",
  },
  progress: {
    label: "Juegos probados",
    value: (checked: number, required: number) => `${checked} de ${required}`,
  },
  games: {
    heading: "Juegos del pasaporte",
    empty: "Los stands se asignan antes del evento. Vuelve pronto.",
    stand: (standCode: string) => `Stand ${standCode}`,
    checked: "Probado",
    pending: "Pendiente",
  },
  raffle: {
    heading: "Sorteo",
    /** Error del servidor cuando alguien pide el boleto antes de tiempo. */
    notYet: (missing: number) => `${missingGames(missing)} para obtener tu boleto.`,
    locked: (missing: number) => `${missingGames(missing)} para obtener tu boleto del sorteo.`,
    noStands: "El sorteo se abre cuando los equipos tengan stand asignado.",
    claimIntro: "Probaste todos los juegos. Deja tu teléfono para obtener tu boleto.",
    phoneLabel: "Teléfono",
    phonePlaceholder: "998 123 4567",
    phoneHint: "Si sales sorteado, te mandamos un mensaje para que te presentes en el main stage.",
    submit: "Obtener mi boleto",
    ticketKicker: "Boleto del sorteo",
    winner: "Saliste sorteado. Preséntate en el main stage con este pasaporte para recoger tu premio.",
    participating:
      "Ya participas. Si sales sorteado te mandamos un mensaje; el staff escaneará tu QR para confirmar que el boleto es tuyo.",
  },
  traffic: {
    levels: TRAFFIC_LEVELS,
    /** "Sin fila · 3 en 15 min". */
    summary: (level: TrafficLevel, recentCheckIns: number, windowMinutes: number) =>
      `${TRAFFIC_LEVELS[level]} · ${recentCheckIns} en ${windowMinutes} min`,
  },
} as const;
