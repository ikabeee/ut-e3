import { readFormText } from "@shared/lib/form-data";

export const RATING_FIELDS = ["gameRating", "standRating", "artRating"] as const;

export type RatingField = (typeof RATING_FIELDS)[number];

export type Ratings = Record<RatingField, number>;

export const RATING_VALUES = [1, 2, 3, 4, 5] as const;

const PIN_FORMAT = /^\d{5}$/;

const RATING_FORMAT = /^[1-5]$/;

/** The PIN as typed on the kiosk, or null when it lacks the 5 digits of a passport (RF-14). */
export function parsePin(raw: string): string | null {
  const pin = raw.trim();

  return PIN_FORMAT.test(pin) ? pin : null;
}

/** The three ratings of the survey, or null when one is missing or outside 1 to 5 (RF-26). */
export function parseRatings(form: FormData): Ratings | null {
  const [gameRating, standRating, artRating] = RATING_FIELDS.map((field) => readFormText(form, field));

  if (![gameRating, standRating, artRating].every((value) => RATING_FORMAT.test(value))) return null;

  return { gameRating: Number(gameRating), standRating: Number(standRating), artRating: Number(artRating) };
}
