import "server-only";
import { getExampleMessage } from "@features/example/lib/server/example-queries";

/**
 * Route Handler de la feature (`GET`). `example` no se monta, así que no existe
 * `src/app/api/example/route.ts`; al copiar la feature créalo con una sola línea:
 * `export { GET } from "@features/<feature>/api/<feature>-route";`.
 */
export async function GET() {
  return Response.json(await getExampleMessage());
}
