import type { ReactNode } from "react";
import { LandingWordmark } from "@features/landing/components/landing-wordmark";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";

interface LandingGamesSectionProps {
  teamCount: number;
  /** El carrusel de juegos. */
  children: ReactNode;
}

/** Banda oscura de juegos: título, cantidad de equipos y el carrusel, que sangra hasta el borde derecho. */
export function LandingGamesSection({ teamCount, children }: Readonly<LandingGamesSectionProps>) {
  return (
    <div className="bg-landing-band py-16 text-background md:pt-36 md:pb-[126px]">
      <div className="flex flex-col gap-8 pl-[clamp(1rem,4.3vw,4.06rem)] md:gap-[63px]">
        <header className="flex flex-col gap-4 md:gap-8 md:pl-[0.8vw]">
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
