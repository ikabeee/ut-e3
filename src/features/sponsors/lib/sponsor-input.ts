import { SPONSORS_COPY } from "@features/sponsors/lib/sponsors-copy";
import { readFormText } from "@shared/lib/form-data";

export type SponsorField = "name" | "logoPath" | "websiteUrl" | "phone" | "email" | "services" | "position";

export type SponsorInput = Record<Exclude<SponsorField, "position" | "email">, string> & {
  email: string | null;
  position: number;
};

export type SponsorErrors = Partial<Record<SponsorField, string>>;

export type ParsedSponsor = { isValid: true; sponsor: SponsorInput } | { isValid: false; errors: SponsorErrors };

export const NAME_MAX_LENGTH = 80;

export const SERVICES_MAX_LENGTH = 200;

// The longest address an SMTP path allows (RFC 5321).
export const EMAIL_MAX_LENGTH = 254;

// A file served from public/ (next/image only loads local logos), without `..` segments.
const LOGO_PATH = /^\/(?:[\w-]+\/)*[\w.-]+\.(?:svg|png|jpe?g|webp)$/i;

// E.164, as the CHECK of the table asks (`phone GLOB '+[0-9]*'`).
const PHONE = /^\+\d{8,15}$/;

// Something@something.tld with no spaces: enough to catch typos, the owner confirms the rest.
const EMAIL = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;

const ERRORS = SPONSORS_COPY.admin.errors;

/**
 * The card of a sponsor (RF-41): name, logo, website, contact phone, services and the place in the list. The website,
 * the phone, the email and the services may stay empty: not every sponsor gives them, and the landing leaves them out.
 */
export function parseSponsorInput(form: FormData): ParsedSponsor {
  const sponsor = {
    name: readFormText(form, "name").trim(),
    logoPath: readFormText(form, "logoPath").trim(),
    websiteUrl: readFormText(form, "websiteUrl").trim(),
    phone: readFormText(form, "phone").replaceAll(/[\s()-]/g, ""),
    email: readFormText(form, "email").trim().toLowerCase() || null,
    services: readFormText(form, "services").trim(),
    position: Number(readFormText(form, "position").trim()),
  };

  const errors = findErrors(sponsor);

  return Object.keys(errors).length > 0 ? { isValid: false, errors } : { isValid: true, sponsor };
}

function findErrors(sponsor: SponsorInput): SponsorErrors {
  const checks: [SponsorField, boolean][] = [
    ["name", sponsor.name.length > 0 && sponsor.name.length <= NAME_MAX_LENGTH],
    ["logoPath", LOGO_PATH.test(sponsor.logoPath) && !sponsor.logoPath.includes("..")],
    ["websiteUrl", sponsor.websiteUrl === "" || isHttpsUrl(sponsor.websiteUrl)],
    ["phone", sponsor.phone === "" || PHONE.test(sponsor.phone)],
    ["email", sponsor.email === null || (sponsor.email.length <= EMAIL_MAX_LENGTH && EMAIL.test(sponsor.email))],
    ["services", sponsor.services.length <= SERVICES_MAX_LENGTH],
    ["position", Number.isInteger(sponsor.position) && sponsor.position >= 1 && sponsor.position <= 999],
  ];

  return Object.fromEntries(checks.flatMap(([field, isValid]) => (isValid ? [] : [[field, ERRORS[field]]])));
}

function isHttpsUrl(text: string): boolean {
  return URL.canParse(text) && new URL(text).protocol === "https:";
}
