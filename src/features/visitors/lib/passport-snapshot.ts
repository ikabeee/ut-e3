import type { Passport, PassportStand, PassportTicket, PassportVisits } from "@features/visitors/lib/types";

/** The copy of the passport that the phone keeps to show it without a network. It lives in the phone only. */
export interface PassportSnapshot {
  /** When the data was loaded from the server (ISO 8601). */
  savedAt: string;
  passport: Passport;
  visits: PassportVisits;
}

// The version is part of the key: a change in the shape starts from an empty copy instead of reading an old one.
export const PASSPORT_SNAPSHOT_KEY = "ute3.passport.v1";

const MINUTE_MS = 60 * 1000;

const HOUR_MS = 60 * MINUTE_MS;

const DAY_MS = 24 * HOUR_MS;

export function createSnapshot({ passport, visits, now }: { passport: Passport; visits: PassportVisits; now: Date }) {
  return { savedAt: now.toISOString(), passport, visits } satisfies PassportSnapshot;
}

export function serializeSnapshot(snapshot: PassportSnapshot): string {
  return JSON.stringify(snapshot);
}

/** The saved copy, or `null` when there is none or it is not valid: a broken copy is never shown. */
export function parseSnapshot(raw: string | null): PassportSnapshot | null {
  if (raw === null) return null;

  try {
    const value = JSON.parse(raw);

    return isSnapshot(value) ? value : null;
  } catch {
    return null;
  }
}

/** "hace un momento", "hace 5 min", "hace 2 h" or "hace 3 días", from the time the data was saved. */
export function describeSnapshotAge({ savedAt, now }: { savedAt: string; now: number }): string {
  const elapsed = Math.max(0, now - Date.parse(savedAt));

  if (elapsed < MINUTE_MS) return "hace un momento";

  if (elapsed < HOUR_MS) return `hace ${Math.floor(elapsed / MINUTE_MS)} min`;

  if (elapsed < DAY_MS) return `hace ${Math.floor(elapsed / HOUR_MS)} h`;

  const days = Math.floor(elapsed / DAY_MS);

  return `hace ${days} ${days === 1 ? "día" : "días"}`;
}

function isSnapshot(value: unknown): value is PassportSnapshot {
  return (
    isObject(value) &&
    "savedAt" in value &&
    typeof value.savedAt === "string" &&
    !Number.isNaN(Date.parse(value.savedAt)) &&
    "passport" in value &&
    isPassport(value.passport) &&
    "visits" in value &&
    isVisits(value.visits)
  );
}

function isPassport(value: unknown): value is Passport {
  return (
    isObject(value) &&
    "gamertag" in value &&
    typeof value.gamertag === "string" &&
    "pin" in value &&
    typeof value.pin === "string"
  );
}

function isVisits(value: unknown): value is PassportVisits {
  return (
    isObject(value) &&
    "visitCount" in value &&
    typeof value.visitCount === "number" &&
    "stands" in value &&
    Array.isArray(value.stands) &&
    value.stands.every(isStand) &&
    "tickets" in value &&
    Array.isArray(value.tickets) &&
    value.tickets.every(isTicket)
  );
}

function isStand(value: unknown): value is PassportStand {
  return (
    isObject(value) &&
    "code" in value &&
    typeof value.code === "string" &&
    "visited" in value &&
    typeof value.visited === "boolean"
  );
}

function isTicket(value: unknown): value is PassportTicket {
  return (
    isObject(value) &&
    "number" in value &&
    typeof value.number === "number" &&
    "milestone" in value &&
    typeof value.milestone === "number"
  );
}

function isObject(value: unknown): value is object {
  return value !== null && typeof value === "object";
}
