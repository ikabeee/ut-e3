import { EVENT_SETTINGS_COPY } from "@features/event-settings/lib/event-settings-copy";
import { parseCancunDateTimeInput } from "@shared/lib/date-time";
import { readFormText } from "@shared/lib/form-data";

/** The instants the sysadmin edits (section 1.1 of the SRS). They travel as ISO strings in UTC. */
export const EDITABLE_INSTANT_FIELDS = [
  "eventStartsAt",
  "eventEndsAt",
  "registrationOpensAt",
  "kofRegistrationOpensAt",
  "kofCheckInStartsAt",
  "kofCheckInEndsAt",
  "kofOnsiteSignupStartsAt",
  "kofOnsiteSignupEndsAt",
  "kofBracketGeneratesAt",
  "marketplaceClosesAt",
  "itchOpensAt",
  "checkInCutoffAt",
  "raffleStartsAt",
] as const;

/** The thresholds of the fraud alerts (RF-45). The database also refuses 0 or less (UT-AD-16). */
export const THRESHOLD_FIELDS = ["fraudTopScoreCount", "fraudWindowMinutes", "fraudSingleVisitMax"] as const;

export const THRESHOLD_MAX = 1000;

export type InstantField = (typeof EDITABLE_INSTANT_FIELDS)[number];

export type ThresholdField = (typeof THRESHOLD_FIELDS)[number];

export type EventSettingsField = InstantField | ThresholdField | "marketplaceFormUrl";

export type EditableEventSettings = Record<InstantField, string> &
  Record<ThresholdField, number> & { marketplaceFormUrl: string | null };

export type EventSettingsErrors = Partial<Record<EventSettingsField, string>>;

interface UrlReading {
  value: string | null;
  errors: EventSettingsErrors;
}

export type ParsedEventSettings =
  { isValid: true; settings: EditableEventSettings } | { isValid: false; errors: EventSettingsErrors };

const ERRORS = EVENT_SETTINGS_COPY.admin.errors;

// Each pair must keep its order; the same rules are CHECKs of the table (UT-ES-01, UT-ES-04).
const ORDERED_PAIRS: readonly { first: InstantField; second: InstantField; message: string }[] = [
  { first: "eventStartsAt", second: "eventEndsAt", message: ERRORS.eventWindow },
  { first: "kofCheckInStartsAt", second: "kofCheckInEndsAt", message: ERRORS.kofCheckInWindow },
  { first: "kofOnsiteSignupStartsAt", second: "kofOnsiteSignupEndsAt", message: ERRORS.kofOnsiteWindow },
  { first: "checkInCutoffAt", second: "raffleStartsAt", message: ERRORS.cutoffBeforeRaffle },
];

/**
 * The fields whose error goes away when `field` is edited: the field itself and, for an ordered pair, the other hour.
 * An error such as "the cutoff must be before the raffle" sits on one of them, and fixing either one answers it.
 */
export function getRelatedFields(field: string): string[] {
  const partners = ORDERED_PAIRS.filter((pair) => pair.first === field || pair.second === field).flatMap((pair) => [
    pair.first,
    pair.second,
  ]);

  return [field, ...partners];
}

/** Reads the form of the panel: Cancun wall-clock times, whole-number thresholds and an optional https URL. */
export function parseEventSettingsInput(form: FormData): ParsedEventSettings {
  const instants = readInstants(form);
  const thresholds = readThresholds(form);
  const url = readUrl(form);
  const errors: EventSettingsErrors = { ...instants.errors, ...thresholds.errors, ...url.errors };

  if (Object.keys(instants.errors).length === 0) Object.assign(errors, checkOrder(instants.values));

  if (Object.keys(errors).length > 0) return { isValid: false, errors };

  // SAFETY: no errors means readInstants stored every field of EDITABLE_INSTANT_FIELDS.
  const instantValues = instants.values as Record<InstantField, string>;
  // SAFETY: no errors means readThresholds stored every field of THRESHOLD_FIELDS.
  const thresholdValues = thresholds.values as Record<ThresholdField, number>;

  return { isValid: true, settings: { ...instantValues, ...thresholdValues, marketplaceFormUrl: url.value } };
}

function readInstants(form: FormData) {
  const values: Partial<Record<InstantField, string>> = {};
  const errors: EventSettingsErrors = {};

  for (const field of EDITABLE_INSTANT_FIELDS) {
    const instant = parseCancunDateTimeInput(readFormText(form, field));

    if (instant) values[field] = instant;
    else errors[field] = ERRORS.invalidDateTime;
  }

  return { values, errors };
}

function readThresholds(form: FormData) {
  const values: Partial<Record<ThresholdField, number>> = {};
  const errors: EventSettingsErrors = {};

  for (const field of THRESHOLD_FIELDS) {
    const text = readFormText(form, field).trim();
    const value = Number(text);

    if (/^\d+$/.test(text) && value >= 1 && value <= THRESHOLD_MAX) values[field] = value;
    else errors[field] = ERRORS.positiveInteger(THRESHOLD_MAX);
  }

  return { values, errors };
}

function readUrl(form: FormData): UrlReading {
  const text = readFormText(form, "marketplaceFormUrl").trim();

  if (!text) return { value: null, errors: {} };

  return isHttpsUrl(text)
    ? { value: text, errors: {} }
    : { value: null, errors: { marketplaceFormUrl: ERRORS.httpsUrl } };
}

function isHttpsUrl(text: string): boolean {
  return URL.canParse(text) && new URL(text).protocol === "https:";
}

function checkOrder(values: Partial<Record<InstantField, string>>): EventSettingsErrors {
  const errors: EventSettingsErrors = {};

  for (const { first, second, message } of ORDERED_PAIRS) {
    if ((values[first] ?? "") >= (values[second] ?? "")) errors[second] = message;
  }

  return errors;
}
