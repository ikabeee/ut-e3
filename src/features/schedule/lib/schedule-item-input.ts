import { SCHEDULE_COPY } from "@features/schedule/lib/schedule-copy";
import { parseCancunDateTimeInput } from "@shared/lib/date-time";
import { readFormText } from "@shared/lib/form-data";

export type ScheduleItemField = "title" | "description" | "startsAt" | "endsAt" | "zone";

export type ScheduleItemErrors = Partial<Record<ScheduleItemField, string>>;

export interface ScheduleItemInput {
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  zone: string | null;
}

export type ParsedScheduleItem =
  { isValid: true; id: string; item: ScheduleItemInput } | { isValid: false; errors: ScheduleItemErrors };

export const NO_ZONE = "none";

export const TITLE_MAX_LENGTH = 120;

export const DESCRIPTION_MAX_LENGTH = 280;

const { errors: MESSAGES } = SCHEDULE_COPY.admin;

// The form sends Cancun wall-clock times and a zone id; the item keeps UTC instants and null for "Sin zona".
export function parseScheduleItemInput(form: FormData, zoneIds: readonly string[]): ParsedScheduleItem {
  const title = readFormText(form, "title").trim();
  const description = readFormText(form, "description").trim();
  const startsAt = parseCancunDateTimeInput(readFormText(form, "startsAt"));
  const endsAt = parseCancunDateTimeInput(readFormText(form, "endsAt"));
  const zone = readFormText(form, "zone");

  const errors: ScheduleItemErrors = {
    title: checkText(title, MESSAGES.titleRequired, TITLE_MAX_LENGTH),
    description: checkText(description, MESSAGES.descriptionRequired, DESCRIPTION_MAX_LENGTH),
    startsAt: startsAt ? undefined : MESSAGES.invalidDateTime,
    endsAt: checkEnd(startsAt, endsAt),
    zone: zone === NO_ZONE || zoneIds.includes(zone) ? undefined : MESSAGES.unknownZone,
  };

  if (!startsAt || !endsAt || Object.values(errors).some(Boolean)) {
    return { isValid: false, errors: withoutEmpty(errors) };
  }

  const item = { title, description, startsAt, endsAt, zone: zone === NO_ZONE ? null : zone };

  return { isValid: true, id: readFormText(form, "id"), item };
}

function checkText(value: string, requiredMessage: string, maxLength: number): string | undefined {
  if (!value) return requiredMessage;

  return value.length > maxLength ? MESSAGES.tooLong(maxLength) : undefined;
}

function checkEnd(startsAt: string | null, endsAt: string | null): string | undefined {
  if (!endsAt) return MESSAGES.invalidDateTime;

  return startsAt && endsAt < startsAt ? MESSAGES.endsBeforeStart : undefined;
}

function withoutEmpty(errors: ScheduleItemErrors): ScheduleItemErrors {
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message));
}
