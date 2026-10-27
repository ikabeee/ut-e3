const TIME_ZONE = "America/Cancun";

const DATE_PART_ORDER: Intl.DateTimeFormatPartTypes[] = ["day", "month", "year"];

const TIME_OF_DAY_FORMAT = new Intl.DateTimeFormat("es-MX", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: TIME_ZONE,
});

export type YearStyle = "numeric" | "2-digit";

export function formatTimeOfDay(instant: string): string {
  return TIME_OF_DAY_FORMAT.format(new Date(instant));
}

export function formatEventDate(instant: string, yearStyle: YearStyle): string {
  const parts = new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: yearStyle,
    timeZone: TIME_ZONE,
  }).formatToParts(new Date(instant));

  return DATE_PART_ORDER.map((type) => partValue(parts, type)).join(".");
}

function partValue(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  return parts.find((part) => part.type === type)?.value ?? "";
}

const DATE_TIME_INPUT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

const WALL_CLOCK_PARTS: Intl.DateTimeFormatPartTypes[] = ["year", "month", "day", "hour", "minute"];

const WALL_CLOCK_FORMAT = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: TIME_ZONE,
});

// A datetime-local value has no zone: the admin forms type Cancun time, and the database keeps the UTC instant (RNF-01).
export function parseCancunDateTimeInput(value: string): string | null {
  const wallClock = parseWallClock(value);

  if (wallClock === null) return null;

  const offset = cancunWallClock(wallClock) - wallClock;

  return new Date(wallClock - offset).toISOString();
}

export function formatCancunDateTimeInput(instant: string): string {
  return new Date(cancunWallClock(new Date(instant).getTime())).toISOString().slice(0, 16);
}

function parseWallClock(value: string): number | null {
  const match = DATE_TIME_INPUT.exec(value);

  if (!match) return null;

  const [year, month, day, hour, minute] = match.slice(1).map(Number);
  const wallClock = new Date(Date.UTC(year, month - 1, day, hour, minute));

  return wallClock.toISOString().slice(0, 16) === value ? wallClock.getTime() : null;
}

// The Cancun wall clock of an instant, written as if it were UTC, so subtracting the two gives the zone offset.
function cancunWallClock(instant: number): number {
  const parts = WALL_CLOCK_FORMAT.formatToParts(new Date(instant));

  const [year, month, day, hour, minute] = WALL_CLOCK_PARTS.map((type) => Number(partValue(parts, type)));

  return Date.UTC(year, month - 1, day, hour, minute);
}
