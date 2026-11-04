"use client";

import { Button } from "@heroui/react";
import { RaffleDrum } from "@features/raffle/components/raffle-drum";
import { RaffleWinnersList } from "@features/raffle/components/raffle-winners-list";
import { useFullscreen } from "@features/raffle/hooks/use-fullscreen";
import { useLiveRaffle, type LiveSnapshotLoader } from "@features/raffle/hooks/use-raffle-snapshot";
import { RAFFLE_COPY } from "@features/raffle/lib/raffle-copy";
import type { RaffleLiveSnapshot } from "@features/raffle/lib/types";

interface RaffleLiveScreenProps {
  initial: RaffleLiveSnapshot;
  /** Replaces the request to the server; the tests pass their own. */
  load?: LiveSnapshotLoader;
}

const COPY = RAFFLE_COPY.live;

/** The screen projected on the main stage: view only, it follows the raffle by polling (RF-49). */
export function RaffleLiveScreen({ initial, load }: Readonly<RaffleLiveScreenProps>) {
  const { value: snapshot, hasConnectionError } = useLiveRaffle(initial, load);
  const { isFullscreen, enter } = useFullscreen();

  return (
    <div className="grid min-h-svh grid-rows-[auto_1fr] gap-6 bg-background p-4 sm:p-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="m-0 type-tiny text-muted">{COPY.title}</h1>
        <div className="flex items-center gap-4">
          {hasConnectionError && <span className="text-sm text-danger">{COPY.connectionLost}</span>}
          {!isFullscreen && (
            <Button variant="tertiary" className="min-h-11" onPress={enter}>
              {COPY.fullscreen}
            </Button>
          )}
        </div>
      </header>
      <div className="grid gap-8 lg:grid-cols-[1fr_minmax(18rem,26rem)]">
        <RaffleDrum snapshot={snapshot} />
        <aside aria-labelledby="live-winners-heading" className="grid content-start gap-3">
          <h2 id="live-winners-heading" className="m-0 type-tiny">
            {COPY.winnersHeading}
          </h2>
          <RaffleWinnersList winners={snapshot.winners} size="stage" />
        </aside>
      </div>
    </div>
  );
}
