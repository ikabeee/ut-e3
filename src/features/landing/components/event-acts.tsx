"use client";

import type { ReactNode } from "react";
import { ActFrame } from "@features/landing/components/act-frame";
import { ActivityTile } from "@features/landing/components/activity-tile";
import { ArcadeCabinet } from "@features/landing/components/pictograms/arcade-cabinet";
import { Fighters } from "@features/landing/components/pictograms/fighters";
import { KartRace } from "@features/landing/components/pictograms/kart-race";
import { RaffleDrum } from "@features/landing/components/pictograms/raffle-drum";
import { RatePhone } from "@features/landing/components/pictograms/rate-phone";
import { VisitsBar } from "@features/landing/components/visits-bar";
import { useActMotion } from "@features/landing/hooks/use-act-motion";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";
import { EVENT_SECTION_ID } from "@features/landing/lib/landing-links";
import { siteConfig } from "@shared/lib/site-config";

interface EventActsProps {
  gamesCount: number;
  raffle: { startsAtLabel: string; cutoffLabel: string };
  kof: { checkInLabel: string; onsiteSignupLabel: string };
  marketplace: ReactNode;
}

type MotionOf = ReturnType<typeof useActMotion>["motionOf"];

export function EventActs({ gamesCount, raffle, kof, marketplace }: Readonly<EventActsProps>) {
  const { containerRef, motionOf } = useActMotion<HTMLElement>();

  return (
    <section id={EVENT_SECTION_ID} ref={containerRef} className="section-block">
      <div className="page-wrap">
        <h2 className="sr-only">{LANDING_COPY.acts.heading}</h2>
        <PlayAct gamesCount={gamesCount} motionOf={motionOf} />
        <RateAct cutoffLabel={raffle.cutoffLabel} motionOf={motionOf} />
        <WinAct raffle={raffle} kof={kof} motionOf={motionOf} />
        <MarketplaceStrip>{marketplace}</MarketplaceStrip>
      </div>
    </section>
  );
}

interface PlayActProps {
  gamesCount: number;
  motionOf: MotionOf;
}

function PlayAct({ gamesCount, motionOf }: Readonly<PlayActProps>) {
  const { play } = LANDING_COPY.acts;
  const line = play.line(gamesCount, siteConfig.organization.division);

  return (
    <ActFrame
      id="play"
      word={play.word}
      motion={motionOf("play")}
      description={<p className="m-0 max-w-[32ch] type-mono text-copy">{line}</p>}
    >
      <div className="mx-auto w-48 sm:w-60">
        <ArcadeCabinet gamesCount={gamesCount} />
      </div>
    </ActFrame>
  );
}

interface RateActProps {
  cutoffLabel: string;
  motionOf: MotionOf;
}

function RateAct({ cutoffLabel, motionOf }: Readonly<RateActProps>) {
  const { rate } = LANDING_COPY.acts;

  return (
    <ActFrame
      id="rate"
      word={rate.word}
      motion={motionOf("rate")}
      description={<p className="m-0 max-w-[44ch] type-mono text-copy">{rate.line(cutoffLabel)}</p>}
    >
      <div className="flex flex-col items-center gap-8 sm:flex-row sm:justify-center">
        <div className="w-32 shrink-0 sm:w-40">
          <RatePhone />
        </div>
        <VisitsBar />
      </div>
    </ActFrame>
  );
}

interface WinActProps {
  raffle: EventActsProps["raffle"];
  kof: EventActsProps["kof"];
  motionOf: MotionOf;
}

function WinAct({ raffle, kof, motionOf }: Readonly<WinActProps>) {
  const { win } = LANDING_COPY.acts;

  return (
    <ActFrame id="win" word={win.word} motion={motionOf("win")}>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-4">
        <ActivityTile title={win.kof.title} line={win.kof.line(kof.checkInLabel, kof.onsiteSignupLabel)}>
          <Fighters />
        </ActivityTile>
        <ActivityTile title={win.marioKart.title} line={win.marioKart.line}>
          <KartRace />
        </ActivityTile>
        <ActivityTile title={win.raffle.title} line={win.raffle.line(raffle.startsAtLabel)}>
          <RaffleDrum />
        </ActivityTile>
      </div>
    </ActFrame>
  );
}

function MarketplaceStrip({ children }: Readonly<{ children: ReactNode }>) {
  const { marketplace } = LANDING_COPY.acts;

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-border py-6">
      <h3 className="m-0 type-wide text-lg leading-none tracking-[-0.03em]">{marketplace.title}</h3>
      <p className="m-0 type-mono text-copy">{marketplace.line}</p>
      {children}
    </div>
  );
}
