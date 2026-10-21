import type { ReactNode } from "react";
import { LandingWordmark } from "@features/landing/components/landing-wordmark";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";

interface LandingGamesSectionProps {
  teamCount: number;
  /** El carrusel de juegos. */
  children: ReactNode;
}

/** Banda oscura de juegos: título, cantidad de equipos y el carrusel. */
export function LandingGamesSection({ teamCount, children }: Readonly<LandingGamesSectionProps>) {
  return (
    <div className="bg-landing-band py-16 text-background">
      <div className="page-wrap flex flex-col gap-8">
        <header className="flex flex-col gap-4">
          <h2>
            <LandingWordmark size="section" />
          </h2>
          <p className="max-w-3xl text-xl capitalize">{LANDING_COPY.games.teamCount(teamCount)}</p>
        </header>
        {children}
      </div>
    </div>
  );
}
