import type { EmailStatus } from "@features/admin/lib/types";

export const EMAIL_PAGE_SIZE = 25;

export type EmailStatusFilter = EmailStatus | "all";

export interface EmailFilters {
  status: EmailStatusFilter;
  recipient: string;
  subject: string;
  /** A day, `YYYY-MM-DD` in Cancun time, or empty. */
  from: string;
  to: string;
  page: number;
}

type SearchParams = Record<string, string | string[] | undefined>;

const STATUSES: readonly EmailStatusFilter[] = ["all", "sent", "pending", "failed"];

const DAY = /^\d{4}-\d{2}-\d{2}$/;

const MAX_TEXT_LENGTH = 200;

/** The filters of the URL; a value that makes no sense reads as "no filter" so a bad link still shows the list. */
export function parseEmailFilters(params: SearchParams): EmailFilters {
  return {
    status: readStatus(readFirst(params.status)),
    recipient: readFirst(params.recipient).trim().slice(0, MAX_TEXT_LENGTH),
    subject: readFirst(params.subject).trim().slice(0, MAX_TEXT_LENGTH),
    from: readDay(readFirst(params.from)),
    to: readDay(readFirst(params.to)),
    page: readPage(readFirst(params.page)),
  };
}

/** The URL of the list with these filters, on the given page; the defaults are left out. */
export function buildEmailsHref(path: string, filters: EmailFilters, page: number = filters.page): string {
  const query = new URLSearchParams();

  if (filters.status !== "all") query.set("status", filters.status);

  for (const name of ["recipient", "subject", "from", "to"] as const) {
    if (filters[name]) query.set(name, filters[name]);
  }

  if (page > 1) query.set("page", String(page));

  const text = query.toString();

  return text ? `${path}?${text}` : path;
}

function readFirst(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function readStatus(value: string): EmailStatusFilter {
  return STATUSES.find((status) => status === value) ?? "all";
}

function readDay(value: string): string {
  return DAY.test(value) && isRealDay(value) ? value : "";
}

// A day that does not exist (February 31) rolls over to the next month when parsed, so it no longer reads back the same.
function isRealDay(value: string): boolean {
  const parsed = new Date(`${value}T00:00:00Z`);

  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

function readPage(value: string): number {
  const page = Number.parseInt(value, 10);

  return Number.isInteger(page) && page > 1 ? page : 1;
}
