export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 60 * SECONDS_PER_MINUTE;
const SECONDS_PER_DAY = 24 * SECONDS_PER_HOUR;

/** Tiempo que falta para `targetIso` desde `nowMs`, sin decimales y sin bajar de cero. */
export function getCountdownParts(targetIso: string, nowMs: number): CountdownParts {
  const totalSeconds = Math.max(0, Math.floor((new Date(targetIso).getTime() - nowMs) / 1000));

  return {
    days: Math.floor(totalSeconds / SECONDS_PER_DAY),
    hours: Math.floor((totalSeconds % SECONDS_PER_DAY) / SECONDS_PER_HOUR),
    minutes: Math.floor((totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE),
    seconds: totalSeconds % SECONDS_PER_MINUTE,
  };
}

/** 5 -> "05". */
export function padCountdownValue(value: number) {
  return String(value).padStart(2, "0");
}

/** "13:30" -> { time: "1:30", period: "PM" }. */
export function splitClockTime(time24: string) {
  const [hours, minutes] = time24.split(":").map(Number);
  const hours12 = hours % 12 || 12;

  return { time: `${hours12}:${String(minutes).padStart(2, "0")}`, period: hours < 12 ? "AM" : "PM" };
}
