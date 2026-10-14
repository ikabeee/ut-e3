import "server-only";
import postgres from "@prisma/orm-postgres/runtime";
import type { Contract } from "@shared/lib/prisma/contract.d";
import contractJson from "@shared/lib/prisma/contract.json" with { type: "json" };

/**
 * Cliente de Prisma 8 compartido por toda la aplicación.
 *
 * Sólo los archivos `lib/` de cada feature deben importarlo.
 * Next.js carga `.env` automáticamente, por eso no se importa `dotenv` aquí.
 *
 * Prisma 8 genera IDs aleatorios por consulta, así que con Cache Components
 * cada consulta debe ir precedida de `await connection()` (request time) o
 * vivir dentro de una función con `"use cache"`.
 */
type PrismaDb = ReturnType<typeof postgres<Contract>>;

let client: PrismaDb | null = null;

function getClient(): PrismaDb {
  if (!client) {
    client = postgres<Contract>({
      contractJson,
      url: process.env["DATABASE_URL"] ?? "",
    });
  }

  return client;
}

function isFunction(value: unknown): value is (...args: unknown[]) => void {
  return typeof value === "function";
}

// SAFETY: Target stub satisfies Proxy constructor typing before runtime delegation.
const proxyTarget = {} as PrismaDb;

// SAFETY: Proxy defers Prisma ORM client initialization until a database query is actually invoked.
export const db: PrismaDb = new Proxy(proxyTarget, {
  get(_target, prop) {
    const active = getClient();
    // SAFETY: Prop delegation forwards property access to the lazily initialized client.
    const value = active[prop as keyof PrismaDb];

    if (isFunction(value)) {
      return value.bind(active);
    }

    return value;
  },
});
