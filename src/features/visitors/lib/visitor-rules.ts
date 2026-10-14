import type { CheckInItem } from "@features/visitors/lib/types";
import { VISITOR_QR_PATH } from "@features/visitors/lib/visitors-links";
import { isUuid, validate, ValidationError, type RawInput } from "@shared/lib/validation";

// Reglas de los visitantes, los check-ins y el sorteo. Son funciones puras: las usan las
// consultas, las Server Actions y el endpoint del escáner, y se prueban sin base de datos.

/** Cookie `httpOnly` con el token del QR del visitante. */
export const VISITOR_COOKIE = "utg_visitor";

/** La cookie dura más que el evento para que el pasaporte siga abierto al día siguiente. */
export const VISITOR_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 60;

/** Igual que el `CHECK` de `visitor.gamertag`: minúsculas, números, "_", "." y "-". */
export const GAMERTAG_PATTERN = /^[a-z0-9_.-]{3,24}$/;

/** Igual que el `CHECK` de `raffle_ticket.phone`: formato internacional. */
export const PHONE_PATTERN = /^\+[1-9]\d{7,14}$/;

/** Lada que se agrega a los teléfonos de 10 dígitos (México). */
export const DEFAULT_PHONE_PREFIX = "+52";

/** Token del QR: 128 bits en hexadecimal (`generateSecret()`). */
const VISITOR_TOKEN_PATTERN = /^[0-9a-f]{32}$/;

/** Máximo de escaneos por lote que acepta `POST /api/check-ins`. */
export const CHECK_IN_BATCH_LIMIT = 200;

/** Minutos que abarca la afluencia de un stand. */
export const TRAFFIC_WINDOW_MINUTES = 15;

/** Máximo de ganadores por sorteo. */
export const MAX_RAFFLE_WINNERS = 50;

export interface VisitorRegistrationInput {
  fullName: string;
  email: string;
  gamertag: string;
}

export function normalizeGamertag(raw: string) {
  return raw.trim().replace(/^@/, "").toLowerCase();
}

/** Genera un apodo válido a partir del nombre o correo si no se proporciona uno. */
export function deriveGamertag(fullName: string, email: string): string {
  const base = fullName
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, ".")
    .replace(/\.+/g, ".")
    .replace(/^\.|\.$/g, "");

  const emailPrefix = (email.split("@")[0] ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const candidate = (base.length >= 3 ? base : emailPrefix).slice(0, 20);

  return candidate.length >= 3 ? candidate : `${candidate || "vis"}123`;
}

/** Formulario de registro del visitante: nombre, correo y opcionalmente apodo. */
export function parseVisitorRegistration(raw: RawInput) {
  return validate(raw, (field) => {
    const hasExplicitFields = Boolean(raw["fullName"] || raw["email"]);

    if (!hasExplicitFields) {
      const gamertag = normalizeGamertag(field.text("gamertag", { label: "El gamertag", max: 40 }));

      if (gamertag && !GAMERTAG_PATTERN.test(gamertag)) {
        field.invalid("gamertag", "Usa de 3 a 24 caracteres: letras sin acento, números, guion bajo, punto o guion.");
      }

      return { gamertag };
    }

    const rawGamertag = field.optionalText("gamertag", { label: "El apodo", max: 40 });
    const fullName = field.text("fullName", { label: "El nombre", max: 120 });
    const email = field.text("email", {
      label: "El correo electrónico",
      max: 120,
      pattern: /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/,
      patternMessage: "Escribe un correo electrónico válido.",
    }).toLowerCase();

    const gamertag = rawGamertag ? normalizeGamertag(rawGamertag) : deriveGamertag(fullName, email);

    if (rawGamertag && !GAMERTAG_PATTERN.test(gamertag)) {
      field.invalid("gamertag", "Usa de 3 a 24 caracteres: letras sin acento, números, guion bajo, punto o guion.");
    }

    return {
      fullName,
      email,
      gamertag,
    };
  });
}

/**
 * Teléfono en formato internacional. Acepta espacios, guiones, puntos y paréntesis, y
 * agrega la lada de México a los números de 10 dígitos: "998 123 4567" -> "+529981234567".
 */
export function normalizePhone(raw: string) {
  const compact = raw.trim().replace(/[\s().-]/g, "");

  if (/^\d{10}$/.test(compact)) return `${DEFAULT_PHONE_PREFIX}${compact}`;

  if (/^00\d+$/.test(compact)) return `+${compact.slice(2)}`;

  return compact;
}

/** Formulario del boleto: el teléfono para avisarle si gana. */
export function parseRaffleClaim(raw: RawInput) {
  return validate(raw, (field) => {
    const phone = normalizePhone(field.text("phone", { label: "El teléfono", max: 30 }));

    if (phone && !PHONE_PATTERN.test(phone)) {
      field.invalid("phone", "Escribe tu número a 10 dígitos o con lada internacional (+52...).");
    }

    return { phone };
  });
}

/** Cantidad de ganadores a sortear. */
export function parseRaffleDraw(raw: RawInput) {
  return validate(raw, (field) => ({
    winners: field.integer("winners", { label: "Los ganadores", min: 1, max: MAX_RAFFLE_WINNERS }),
  }));
}

export function isVisitorToken(value: unknown): value is string {
  return typeof value === "string" && VISITOR_TOKEN_PATTERN.test(value);
}

export function buildVisitorQrUrl(siteUrl: string, token: string) {
  return `${siteUrl.replace(/\/$/, "")}${VISITOR_QR_PATH}/${token}`;
}

/**
 * Token de lo que leyó el escáner: la URL completa del QR (`https://.../v/<token>`) o el
 * token solo. Devuelve `null` si no tiene el formato de un token.
 */
export function extractVisitorToken(scanned: string) {
  const value = scanned.trim().toLowerCase();

  if (isVisitorToken(value)) return value;
  const match = /\/v\/([0-9a-f]{32})\/?(?:[?#].*)?$/.exec(value);

  return match?.[1] ?? null;
}

/**
 * Hora del escaneo ajustada al evento: nunca antes del inicio ni después de que llegó al
 * servidor. Así un reloj adelantado no altera la afluencia y uno atrasado no pierde el escaneo.
 */
export function clampScannedAt(deviceTime: string, eventStart: string, now: Date) {
  const receivedAt = now.getTime();
  const deviceMs = Date.parse(deviceTime);
  // Una hora ilegible cuenta como la hora en que el escaneo llegó al servidor.
  const scannedAt = Number.isNaN(deviceMs) ? receivedAt : deviceMs;

  const notBeforeStart = Math.max(scannedAt, Date.parse(eventStart));
  const notAfterReceived = Math.min(notBeforeStart, receivedAt);

  return new Date(notAfterReceived).toISOString();
}

export interface RawCheckInItem {
  readonly id?: unknown;
  readonly token?: unknown;
  readonly scannedAt?: unknown;
}

export interface CheckInBatchPayload {
  readonly checkIns?: readonly unknown[] | null;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isRawCheckInItem(value: unknown): value is RawCheckInItem {
  return typeof value === "object" && value !== null;
}

function isCheckInItem(value: unknown): value is CheckInItem {
  if (!isRawCheckInItem(value)) return false;

  const { id, token, scannedAt } = value;

  return (
    isString(id) &&
    isUuid(id) &&
    isString(token) &&
    token.length <= 512 &&
    isString(scannedAt) &&
    !Number.isNaN(Date.parse(scannedAt))
  );
}

function isCheckInBatchPayload(value: CheckInBatchPayload | null | undefined): value is CheckInBatchPayload {
  return typeof value === "object" && value !== null;
}

/**
 * Cuerpo de `POST /api/check-ins`: `{ "checkIns": [{ id, token, scannedAt }] }`. Un QR mal
 * leído no invalida el lote (se responde como `unknown`), pero un id o una fecha inválidos sí,
 * porque los genera el propio escáner.
 */
export function parseCheckInBatch(body: CheckInBatchPayload | null | undefined): CheckInItem[] {
  const checkIns = isCheckInBatchPayload(body) ? body.checkIns : undefined;

  if (!Array.isArray(checkIns) || checkIns.length === 0 || checkIns.length > CHECK_IN_BATCH_LIMIT) {
    throw new ValidationError({ checkIns: `Envía de 1 a ${CHECK_IN_BATCH_LIMIT} escaneos en "checkIns".` });
  }

  const validated: CheckInItem[] = [];

  for (let index = 0; index < checkIns.length; index += 1) {
    const item = checkIns[index];

    if (!isCheckInItem(item)) {
      throw new ValidationError({
        [`checkIns.${index}`]: "Cada escaneo necesita un id (UUID), el token del QR y scannedAt (ISO 8601).",
      });
    }

    validated.push({
      id: item.id.toLowerCase(),
      token: item.token,
      scannedAt: item.scannedAt,
    });
  }

  return validated;
}

/**
 * Elige `count` elementos distintos al azar (Fisher-Yates parcial). `randomInt(max)` debe
 * devolver un entero en [0, max); en el servidor se usa `crypto.randomInt`.
 */
export function pickRandom<T>(items: readonly T[], count: number, randomInt: (max: number) => number): T[] {
  const pool = [...items];
  const picked = Math.min(count, pool.length);

  for (let index = 0; index < picked; index += 1) {
    const swap = index + randomInt(pool.length - index);
    [pool[index], pool[swap]] = [pool[swap], pool[index]];
  }

  return pool.slice(0, picked);
}
