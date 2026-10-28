"use client";

import { PublicMatchCard } from "@features/tournament/components/public-match-card";
import { usePublicBracket, type PublicSnapshotLoader } from "@features/tournament/hooks/use-public-bracket";
import type { PublicBracket, PublicSnapshot } from "@features/tournament/lib/public-bracket";
import { TOURNAMENT_COPY } from "@features/tournament/lib/tournament-copy";
import { MATCH_AREAS } from "@features/tournament/lib/tournament-rules";
import type { MatchArea } from "@features/tournament/lib/types";

interface PublicBracketViewProps {
  /** What the server rendered; the page keeps it fresh by polling. */
  initial: PublicSnapshot;
  /** Replaces the request to the public endpoint; the tests use it. */
  load?: PublicSnapshotLoader;
}

const COPY = TOURNAMENT_COPY.ui;

export function PublicBracketView({ initial, load }: Readonly<PublicBracketViewProps>) {
  const { snapshot, hasConnectionError } = usePublicBracket(initial, load);

  return (
    <div className="grid gap-8">
      {hasConnectionError && (
        <p role="alert" className="border border-danger p-3 text-sm text-danger">
          {COPY.connectionLost}
        </p>
      )}
      {snapshot.state === "open" ? (
        <OpenBracket bracket={snapshot.bracket} />
      ) : (
        <p role="status" className="type-mono text-muted">
          {snapshot.state === "closed" ? COPY.publicBracket.closed : COPY.publicBracket.pending}
        </p>
      )}
    </div>
  );
}

function OpenBracket({ bracket }: Readonly<{ bracket: PublicBracket }>) {
  return (
    <>
      {bracket.phase === "finished" && (
        <p role="status" className="border border-accent p-4 type-mono font-bold">
          {bracket.championTag ? COPY.champion(bracket.championTag) : COPY.noChampion}
        </p>
      )}
      <AreaLinks />
      <LiveMatches bracket={bracket} />
      {MATCH_AREAS.map((area) => (
        <AreaSection key={area} area={area} bracket={bracket} />
      ))}
    </>
  );
}

function AreaLinks() {
  return (
    <nav aria-label={COPY.publicBracket.navLabel}>
      <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
        {MATCH_AREAS.map((area) => (
          <li key={area}>
            <a
              href={`#${getAreaId(area)}`}
              className="inline-flex min-h-11 items-center border border-border px-3 no-underline"
            >
              {TOURNAMENT_COPY.areas[area]}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function LiveMatches({ bracket }: Readonly<{ bracket: PublicBracket }>) {
  const live = bracket.matches.filter((match) => match.status === "active");

  return (
    <section aria-labelledby="public-live-heading" className="grid gap-4">
      <h2 id="public-live-heading" className="type-section">
        {COPY.publicBracket.live}
      </h2>
      {live.length === 0 ? (
        <p className="type-mono text-muted">{COPY.publicBracket.noLive}</p>
      ) : (
        <ul className="m-0 grid list-none gap-3 p-0 md:grid-cols-2 xl:grid-cols-3">
          {live.map((match) => (
            <PublicMatchCard key={match.number} match={match} />
          ))}
        </ul>
      )}
    </section>
  );
}

function AreaSection({ area, bracket }: Readonly<{ area: MatchArea; bracket: PublicBracket }>) {
  const headingId = `${getAreaId(area)}-heading`;

  return (
    <section id={getAreaId(area)} aria-labelledby={headingId} className="grid scroll-mt-4 gap-4">
      <h3 id={headingId} className="type-section">
        {TOURNAMENT_COPY.areas[area]}
      </h3>
      <ul className="m-0 grid list-none gap-3 p-0 md:grid-cols-2 xl:grid-cols-3">
        {bracket.matches
          .filter((match) => match.area === area)
          .map((match) => (
            <PublicMatchCard key={match.number} match={match} />
          ))}
      </ul>
    </section>
  );
}

function getAreaId(area: MatchArea): string {
  return `area-${area}`;
}
