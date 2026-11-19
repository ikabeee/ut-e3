import "server-only";
import type { AuditLog, Prisma, ServerLog } from "@generated/prisma/client";
import {
  LOGS_PAGE_SIZE,
  type AuditLogFilters,
  type LogsDateRange,
  type ServerLogFilters,
} from "@features/admin/lib/logs-filters";
import type { AuditLogRow, LogPage, ServerLogRow } from "@features/admin/lib/types";
import { getPrisma } from "@shared/lib/server/prisma";
import { SERVER_LOG_LEVELS, SERVER_LOG_SOURCES } from "@shared/lib/server-log-types";

const NEWEST_FIRST = [{ createdAt: "desc" }, { id: "desc" }] as const;

/** One page of the audit log (the "Bitácora" tab), newest first; each filter that is empty is not applied. */
export async function getAuditLogPage(filters: AuditLogFilters): Promise<LogPage<AuditLogRow>> {
  const where = buildAuditWhere(filters);
  const total = await getPrisma().auditLog.count({ where });
  const page = clampPage(filters.page, total);

  const entries = await getPrisma().auditLog.findMany({
    where,
    orderBy: [...NEWEST_FIRST],
    skip: (page - 1) * LOGS_PAGE_SIZE,
    take: LOGS_PAGE_SIZE,
    include: { actor: { select: { name: true, email: true } } },
  });

  return { rows: entries.map(toAuditLogRow), total, page, pageCount: countPages(total) };
}

/** One page of the server logs (the "Servidor" tab), newest first. */
export async function getServerLogPage(filters: ServerLogFilters): Promise<LogPage<ServerLogRow>> {
  const where = buildServerWhere(filters);
  const total = await getPrisma().serverLog.count({ where });
  const page = clampPage(filters.page, total);

  const entries = await getPrisma().serverLog.findMany({
    where,
    orderBy: [...NEWEST_FIRST],
    skip: (page - 1) * LOGS_PAGE_SIZE,
    take: LOGS_PAGE_SIZE,
  });

  return { rows: entries.map(toServerLogRow), total, page, pageCount: countPages(total) };
}

function buildAuditWhere(filters: AuditLogFilters): Prisma.AuditLogWhereInput {
  const where: Prisma.AuditLogWhereInput = { createdAt: buildDateFilter(filters) };

  if (filters.actor) {
    where.actor = { is: { OR: [{ name: { contains: filters.actor } }, { email: { contains: filters.actor } }] } };
  }

  if (filters.action) where.action = { contains: filters.action };

  if (filters.entity) {
    where.OR = [{ entityType: { contains: filters.entity } }, { entityId: { contains: filters.entity } }];
  }

  return where;
}

function buildServerWhere(filters: ServerLogFilters): Prisma.ServerLogWhereInput {
  const where: Prisma.ServerLogWhereInput = { createdAt: buildDateFilter(filters) };

  if (filters.level) where.level = filters.level;

  if (filters.source) where.source = filters.source;

  if (filters.text) where.message = { contains: filters.text };

  return where;
}

function buildDateFilter({ from, until }: LogsDateRange): Prisma.DateTimeFilter | undefined {
  if (!from && !until) return undefined;

  const filter: Prisma.DateTimeFilter = {};

  if (from) filter.gte = from;

  if (until) filter.lt = until;

  return filter;
}

function countPages(total: number): number {
  return Math.max(1, Math.ceil(total / LOGS_PAGE_SIZE));
}

function clampPage(page: number, total: number): number {
  return Math.min(page, countPages(total));
}

function toAuditLogRow(entry: AuditLog & { actor: { name: string; email: string } | null }): AuditLogRow {
  return {
    id: entry.id,
    createdAt: entry.createdAt.toISOString(),
    actor: entry.actor,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    detail: formatJson(entry.detail),
  };
}

function toServerLogRow(entry: ServerLog): ServerLogRow {
  return {
    id: entry.id,
    createdAt: entry.createdAt.toISOString(),
    // The CHECKs of the table allow only the known values; the fallback is only there for the types.
    level: SERVER_LOG_LEVELS.find((level) => level === entry.level) ?? "info",
    source: SERVER_LOG_SOURCES.find((source) => source === entry.source) ?? "console",
    message: entry.message,
    details: formatJson(entry.details),
  };
}

// The screen shows the JSON as text; an empty object or array is "no details".
function formatJson(value: Prisma.JsonValue): string | null {
  const text = JSON.stringify(value, null, 2);

  return value === null || text === "{}" || text === "[]" ? null : text;
}
