import "server-only";
import postgres from "@prisma/orm-postgres/runtime";
import type { Contract } from "./contract.d";
import contractJson from "./contract.json" with { type: "json" };

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
export const db = postgres<Contract>({
  contractJson,
  url: process.env["DATABASE_URL"]!,
});
