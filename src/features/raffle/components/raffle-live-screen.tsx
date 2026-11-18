"use client";

import Link from "next/link";
import { RaffleDrum } from "@features/raffle/components/raffle-drum";
import { RaffleWinnersList } from "@features/raffle/components/raffle-winners-list";
import { useLiveRaffle, type LiveSnapshotLoader } from "@features/raffle/hooks/use-raffle-snapshot";
import { RAFFLE_COPY } from "@features/raffle/lib/raffle-copy";
import { RAFFLE_WINNERS_PATH } from "@features/raffle/lib/raffle-links";
import type { RaffleLiveSnapshot } from "@features/raffle/lib/types";
import { useErrorToast } from "@shared/hooks/use-error-toast";

interface RaffleLiveScreenProps {
  initial: RaffleLiveSnapshot;
  /** Replaces the request to the server; the tests pass their own. */
  load?: LiveSnapshotLoader;
}

const COPY = RAFFLE_COPY.live;

/** The screen projected on the main stage, under the site navbar: view only, it follows the raffle by polling (RF-49). */
export function RaffleLiveScreen({ initial, load }: Readonly<RaffleLiveScreenProps>) {
  const { value: snapshot, hasConnectionError } = useLiveRaffle(initial, load);

  useErrorToast(hasConnectionError ? COPY.connectionLost : null);

  return (
    <div className="grid min-h-[calc(100svh-var(--nav-height))] grid-rows-[auto_1fr] gap-6 bg-background p-4 sm:p-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <BackLink />
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

// The way out of the stage screen: a link with no underline, so it shows its hover and focus with the accent color.
function BackLink() {
  return (
    <Link
      href={RAFFLE_WINNERS_PATH}
      className="inline-flex min-h-11 items-center text-sm text-muted no-underline transition-colors hover:text-accent focus-visible:text-accent active:opacity-70"
    >
      {COPY.backLink}
    </Link>
  );
}
