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
