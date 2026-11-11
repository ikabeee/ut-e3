import type { ReactNode } from "react";
import { HydrationBoundary, type DehydratedState } from "@tanstack/react-query";

interface QueryHydrationBoundaryProps {
  /** Estado de TanStack Query generado en el servidor (por ejemplo con `dehydrateForPrerender`). */
  state: Promise<DehydratedState>;
  children: ReactNode;
}

/**
 * Espera el estado prellenado en el servidor y lo entrega a la caché de TanStack Query
 * del navegador. Úsalo dentro de `<Suspense>`: los componentes con `useSuspenseQuery`
 * leen la hora actual y Next.js los renderiza en streaming.
 */
export async function QueryHydrationBoundary({ state, children }: Readonly<QueryHydrationBoundaryProps>) {
  return <HydrationBoundary state={await state}>{children}</HydrationBoundary>;
}
