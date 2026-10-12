/** Juego que cuenta para el boleto del sorteo (su equipo tiene stand asignado). */
export interface PassportGame {
  slug: string;
  name: string;
  standCode: string;
  /** `true` si el equipo ya escaneó el QR del visitante en su stand. */
  isChecked: boolean;
}

export interface RaffleTicket {
  ticketNumber: number;
  /** Fecha en que salió sorteado; `null` mientras no gana. */
  wonAt: string | null;
}

/** Lo que ve el visitante en su pasaporte: su QR, su avance y su boleto. */
export interface VisitorPassport {
  gamertag: string;
  /** URL que codifica el QR personal (`/v/<token>`); abrirla recupera la sesión. */
  qrUrl: string;
  /** Juegos con stand, en el orden del croquis. */
  games: PassportGame[];
  checkedCount: number;
  requiredCount: number;
  ticket: RaffleTicket | null;
}

/** Un escaneo tal como lo envía el escáner del stand. */
export interface CheckInItem {
  /** UUID que genera el escáner: reenviar el mismo escaneo no lo duplica. */
  id: string;
  /** Token del QR del visitante (lo que va después de `/v/`). */
  token: string;
  /** Hora del escaneo según el reloj del escáner (ISO 8601). */
  scannedAt: string;
}

/**
 * Resultado de cada escaneo del lote:
 * - `created`: se registró.
 * - `duplicate`: ya estaba registrado (reenvío o segundo escaneo del mismo visitante).
 * - `unknown`: el QR no es de ningún visitante (mal leído o reemplazado).
 */
export type CheckInStatus = "created" | "duplicate" | "unknown";

export interface CheckInResult {
  id: string;
  status: CheckInStatus;
}

/** Afluencia de un stand: visitantes que probaron su juego en los últimos minutos. */
export interface StandTraffic {
  standCode: string;
  recentCheckIns: number;
}

export interface StandTrafficReport {
  /** Minutos que abarca el conteo. */
  windowMinutes: number;
  stands: StandTraffic[];
}

/** Ganador del sorteo tal como lo ve el panel de administración. */
export interface RaffleWinner {
  ticketNumber: number;
  gamertag: string;
  phone: string;
  wonAt: string;
  notifiedAt: string | null;
}

/** QR nuevo de un visitante que perdió el suyo (lo genera el staff). */
export interface ReissuedVisitorQr {
  gamertag: string;
  qrUrl: string;
}
