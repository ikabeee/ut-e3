import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import {
  defaultShouldDehydrateQuery,
  QueryClient,
  type DehydratedState,
  type QueryKey,
} from "@tanstack/react-query";

export interface PrerenderedQuery {
  queryKey: QueryKey;
  data: unknown;
}

/**
 * Momento en que se generaron los datos. Se cachea con las mismas etiquetas que las
 * consultas: al invalidarlas avanzan juntos los datos y su fecha.
 */
async function getHydrationUpdatedAt(tags: string[]) {
  "use cache";
  cacheTag(...tags);
  cacheLife("max");

  return Date.now();
}

/**
 * Versión prerenderizable de `dehydrate()` de TanStack Query.
 *
 * Con Cache Components, `dehydrate()` lee `Date.now()` durante el prerender y Next.js
 * detiene el build. Aquí la fecha sale de una función cacheada y el estado se arma a mano
 * (patrón de la guía de Next.js "client-side-data-fetching/tanstack-query").
 *
 * @param queries datos ya obtenidos (con consultas cacheadas) y su query key.
 * @param tags etiquetas de caché de esas consultas (`cacheTag`).
 */
export async function dehydrateForPrerender(
  queries: readonly PrerenderedQuery[],
  tags: string[],
): Promise<DehydratedState> {
  const updatedAt = await getHydrationUpdatedAt(tags);
  const queryClient = new QueryClient();

  for (const query of queries) {
    queryClient.setQueryData(query.queryKey, query.data, { updatedAt });
  }

  return {
    mutations: [],
    queries: queryClient
      .getQueryCache()
      .getAll()
      .filter((query) => defaultShouldDehydrateQuery(query))
      .map((query) => ({
        dehydratedAt: updatedAt,
        queryHash: query.queryHash,
        queryKey: query.queryKey,
        state: query.state,
        ...(query.meta ? { meta: query.meta } : {}),
      })),
  };
}
