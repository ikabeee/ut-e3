import "server-only";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@generated/prisma/client";

const DATABASE_URL_EXAMPLE = 'DATABASE_URL="file:./dev.db"';

const BUSY_TIMEOUT_MS = 5000;

type OpenConnection = Awaited<ReturnType<PrismaBetterSqlite3["connect"]>>;

// Next.js dev re-runs this module on every hot reload; keeping the client on globalThis avoids one connection per edit.
const processGlobal: typeof globalThis & { prisma?: PrismaClient; openConnections?: Set<OpenConnection> } = globalThis;

export function getPrisma(): PrismaClient {
  processGlobal.prisma ??= createPrismaClient();

  return processGlobal.prisma;
}

function createPrismaClient(): PrismaClient {
  const url = parseDatabaseUrl(process.env.DATABASE_URL);

  return new PrismaClient({ adapter: new WalBetterSqlite3({ url, timeout: BUSY_TIMEOUT_MS }) });
}

function parseDatabaseUrl(value: string | undefined): string {
  const url = value?.trim();

  if (!url) {
    throw new Error(`Falta DATABASE_URL. Defínela en el entorno o en .env, por ejemplo ${DATABASE_URL_EXAMPLE}.`);
  }

  if (!url.startsWith("file:")) {
    throw new Error(
      `DATABASE_URL debe ser la ruta de un archivo SQLite que empiece con "file:", por ejemplo ${DATABASE_URL_EXAMPLE}. Valor recibido: "${url}".`,
    );
  }

  return url;
}

function trackConnection(connection: OpenConnection): void {
  if (!processGlobal.openConnections) {
    processGlobal.openConnections = new Set();
    process.once("exit", closeOpenConnections);
  }

  processGlobal.openConnections.add(connection);
}

/**
 * Closes every SQLite connection of the process. On SIGTERM `next start` calls `process.exit()` without disconnecting
 * Prisma, and only a clean close checkpoints the WAL and deletes app.db-wal and app.db-shm: a leftover WAL is applied
 * on top of a restored backup and corrupts it (docs/deploy.md). better-sqlite3 closes synchronously inside `dispose()`,
 * so this works in the "exit" handler, which cannot wait for promises.
 */
export function closeOpenConnections(): void {
  for (const connection of processGlobal.openConnections ?? []) {
    try {
      void connection.dispose();
    } catch (cause) {
      console.error(`Could not close the database: ${cause instanceof Error ? cause.message : "Unknown error"}`);
    }
  }

  processGlobal.openConnections?.clear();
}

// WAL is not an adapter option, so each connection switches to it before Prisma sends the caller's first query.
class WalBetterSqlite3 extends PrismaBetterSqlite3 {
  override async connect() {
    const adapter = await super.connect();

    await adapter.executeScript("PRAGMA journal_mode = WAL");
    trackConnection(adapter);

    return adapter;
  }
}
