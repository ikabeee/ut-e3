import { parsePerson } from "@features/accounts/lib/invitation-input";
import { getZoneCapacity, toStandZone, type StandZone } from "@features/stands/lib/stand-zones";
import { STANDS_COPY } from "@features/stands/lib/stands-copy";
import { readFormText } from "@shared/lib/form-data";

export interface StandFields {
  zone: StandZone;
  number: number;
  studio: number;
  groupCode: string;
}

export interface AdminPerson {
  name: string;
  email: string;
}

export type ParsedStandFields = { isValid: true; fields: StandFields } | { isValid: false; message: string };

export type ParsedNewStand =
  { isValid: true; fields: StandFields; admin: AdminPerson } | { isValid: false; message: string };

export type ParsedAdminPerson = { isValid: true; admin: AdminPerson } | { isValid: false; message: string };

const ERRORS = STANDS_COPY.admin.errors;

const MAX_STUDIO = 99;

const GROUP_PATTERN = /^[A-Za-z0-9]{1,6}$/;

/** The stand and the person who will administer it, which are created together (RF-39). */
export function parseNewStand(form: FormData): ParsedNewStand {
  const fields = parseStandFields(form);
  const admin = parseAdminPerson(form);

  if (!fields.isValid) return fields;

  return admin.isValid ? { isValid: true, fields: fields.fields, admin: admin.admin } : admin;
}

/** The zone, number, studio and group of a stand (RF-39). The code is built from them and never typed. */
export function parseStandFields(form: FormData): ParsedStandFields {
  const zone = toStandZone(readFormText(form, "zone").trim());
  const number = parseWholeNumber(readFormText(form, "number"));
  const studio = parseWholeNumber(readFormText(form, "studio"));
  const groupCode = readFormText(form, "groupCode").trim().toUpperCase();

  if (!zone) return invalid(ERRORS.zoneInvalid);

  if (number < 1 || number > getZoneCapacity(zone)) return invalid(ERRORS.numberInvalid(getZoneCapacity(zone)));

  if (studio < 1 || studio > MAX_STUDIO) return invalid(ERRORS.studioInvalid);

  if (!GROUP_PATTERN.test(groupCode)) return invalid(ERRORS.groupInvalid);

  return { isValid: true, fields: { zone, number, studio, groupCode } };
}

export function parseAdminPerson(form: FormData): ParsedAdminPerson {
  const person = parsePerson(form, { name: "adminName", email: "adminEmail" });

  return person.isValid ? { isValid: true, admin: { name: person.name, email: person.email } } : person;
}

function invalid(message: string): ParsedStandFields {
  return { isValid: false, message };
}

// Digits only; anything else is -1, which every range check refuses.
function parseWholeNumber(value: string): number {
  const text = value.trim();

  return /^\d{1,3}$/.test(text) ? Number(text) : -1;
}
