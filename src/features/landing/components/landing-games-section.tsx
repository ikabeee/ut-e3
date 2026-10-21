import type { ReactNode } from "react";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";

interface LandingGamesSectionProps {
  teamCount: number;
  /** El carrusel: la page lo pone dentro de `Suspense` y `QueryHydrationBoundary`. */
  children: ReactNode;
}

/** Banda oscura de juegos: título, cantidad de equipos y el carrusel. */
export function LandingGamesSection({ teamCount, children }: Readonly<LandingGamesSectionProps>) {
  return (
    <div className="page-wrap py-6">
      <div className="flex flex-col gap-8 rounded-[25px] bg-foreground p-6 text-background lg:p-12">
        <header className="flex flex-col gap-4">
          <h2 className="type-giant font-wide uppercase">{LANDING_COPY.games.title}</h2>
          <p className="max-w-xl text-sm">{LANDING_COPY.games.teamCount(teamCount)}</p>
        </header>
        {children}
      </div>
    </div>
  );
}
