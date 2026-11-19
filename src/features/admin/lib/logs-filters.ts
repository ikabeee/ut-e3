import { parseCancunDateTimeInput } from "@shared/lib/date-time";
import {
  SERVER_LOG_LEVELS,
  SERVER_LOG_SOURCES,
  type ServerLogLevel,
  type ServerLogSource,
} from "@shared/lib/server-log-types";

export type LogsTab = "audit" | "server";

type ParamValue = string | string[] | undefined;

export type LogsSearchParams = Record<string, ParamValue>;

/** A day range typed by the sysadmin in Cancun time; `until` is the start of the day after the last day (exclusive). */
export interface LogsDateRange {
  fromDate: string;
  toDate: string;
  from: Date | null;
  until: Date | null;
}

export interface AuditLogFilters extends LogsDateRange {
  actor: string;
  action: string;
  entity: string;
  page: number;
}

export interface ServerLogFilters extends LogsDateRange {
  level: ServerLogLevel | null;
  source: ServerLogSource | null;
  text: string;
  isAutoRefresh: boolean;
  page: number;
}

export const LOGS_PAGE_SIZE = 25;

const MAX_TEXT_LENGTH = 100;

const DAY_MS = 24 * 60 * 60_000;

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function parseLogsTab(params: LogsSearchParams): LogsTab {
  return readText(params.tab) === "server" ? "server" : "audit";
}

export function parseAuditLogFilters(params: LogsSearchParams): AuditLogFilters {
  return {
    actor: readText(params.actor),
    action: readText(params.action),
    entity: readText(params.entity),
    page: readPage(params.page),
    ...readDateRange(params),
  };
}

export function parseServerLogFilters(params: LogsSearchParams): ServerLogFilters {
  return {
    level: readChoice(params.level, SERVER_LOG_LEVELS),
    source: readChoice(params.source, SERVER_LOG_SOURCES),
    text: readText(params.q),
    isAutoRefresh: readText(params.auto) === "1",
    page: readPage(params.page),
    ...readDateRange(params),
  };
}

function readText(value: ParamValue): string {
  const first = Array.isArray(value) ? value[0] : value;

  return (first ?? "").trim().slice(0, MAX_TEXT_LENGTH);
}

function readChoice<Choice extends string>(value: ParamValue, choices: readonly Choice[]): Choice | null {
  const text = readText(value);

  return choices.find((choice) => choice === text) ?? null;
}

function readPage(value: ParamValue): number {
  const page = Number(readText(value));

  return Number.isInteger(page) && page >= 1 ? page : 1;
}

function readDateRange(params: LogsSearchParams): LogsDateRange {
  const from = readDayStart(params.from);
  const to = readDayStart(params.to);

  return {
    fromDate: from?.day ?? "",
    toDate: to?.day ?? "",
    from: from?.start ?? null,
    until: to ? new Date(to.start.getTime() + DAY_MS) : null,
  };
}

// Cancun has no daylight saving time, so a day is always 24 hours.
function readDayStart(value: ParamValue): { day: string; start: Date } | null {
  const day = readText(value);
  const instant = DAY_PATTERN.test(day) ? parseCancunDateTimeInput(`${day}T00:00`) : null;

  return instant === null ? null : { day, start: new Date(instant) };
}
