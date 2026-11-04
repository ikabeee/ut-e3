export const PIN_FILTER_API_PATH = "/api/stand/pin-filter";

/** PBKDF2 rounds: the kiosk hashes one PIN, the server one per visitor every time the filter changes (RNF-19). */
export const PIN_FILTER_ITERATIONS = 1000;

/** The reduced space is 50 times the number of registered PINs, so about 2 % of the other PINs pass (RNF-19). */
export const PIN_FILTER_SPACE_FACTOR = 50;

// The first 6 bytes of the digest: an integer that stays exact in a JavaScript number.
const DIGEST_PREFIX_BYTES = 6;

const DIGEST_BITS = 256;

/** How a PIN is reduced; the kiosk downloads it with the values. */
export interface PinFilterParams {
  salt: string;
  iterations: number;
  modulus: number;
}

/** What the kiosk downloads: the reduced values of the registered PINs, never the PINs nor their full digests. */
export interface PinFilter extends PinFilterParams {
  values: number[];
}

/** Builds the filter of the registered PINs (RF-78). Several PINs can share a value; it is kept once. */
export async function buildPinFilter(pins: string[], salt: string, iterations = PIN_FILTER_ITERATIONS) {
  const params: PinFilterParams = { salt, iterations, modulus: PIN_FILTER_SPACE_FACTOR * Math.max(pins.length, 1) };
  const reduced = await Promise.all(pins.map((pin) => reducePin(pin, params)));
  const values = [...new Set(reduced)].sort((left, right) => left - right);

  return { ...params, values } satisfies PinFilter;
}

/** The PIN hashed with PBKDF2-SHA-256 and the salt of the event, reduced to the space of the filter. */
export async function reducePin(pin: string, params: PinFilterParams): Promise<number> {
  const encoder = new TextEncoder();
  const subtle = globalThis.crypto.subtle;
  const key = await subtle.importKey("raw", encoder.encode(pin), "PBKDF2", false, ["deriveBits"]);

  const algorithm = {
    name: "PBKDF2",
    hash: "SHA-256",
    salt: encoder.encode(params.salt),
    iterations: params.iterations,
  };

  const bits = await subtle.deriveBits(algorithm, key, DIGEST_BITS);

  return readPrefix(new Uint8Array(bits)) % params.modulus;
}

/** Whether the PIN may be registered: a registered one always passes; about 2 % of the others pass too. */
export async function mayBeRegisteredPin(pin: string, filter: PinFilter): Promise<boolean> {
  return filter.values.includes(await reducePin(pin, filter));
}

export function isPinFilter(value: unknown): value is PinFilter {
  return (
    isObject(value) &&
    "salt" in value &&
    typeof value.salt === "string" &&
    "iterations" in value &&
    isPositiveInteger(value.iterations) &&
    "modulus" in value &&
    isPositiveInteger(value.modulus) &&
    "values" in value &&
    Array.isArray(value.values) &&
    value.values.every((item) => Number.isInteger(item))
  );
}

function readPrefix(bytes: Uint8Array): number {
  return bytes.slice(0, DIGEST_PREFIX_BYTES).reduce((total, byte) => total * 256 + byte, 0);
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

function isObject(value: unknown): value is object {
  return value !== null && typeof value === "object";
}
