import "server-only";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@generated/prisma/client";

const DATABASE_URL_EXAMPLE = 'DATABASE_URL="file:./dev.db"';

const BUSY_TIMEOUT_MS = 5000;

// Next.js dev re-runs this module on every hot reload; keeping the client on globalThis avoids one connection per edit.
const processGlobal: typeof globalThis & { prisma?: PrismaClient } = globalThis;

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

// WAL is not an adapter option, so each connection switches to it before Prisma sends the caller's first query.
class WalBetterSqlite3 extends PrismaBetterSqlite3 {
  override async connect() {
    const adapter = await super.connect();

    await adapter.executeScript("PRAGMA journal_mode = WAL");

    return adapter;
  }
}
