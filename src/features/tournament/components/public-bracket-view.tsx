"use client";

import { Button } from "@heroui/react";
import { useState } from "react";
import { BracketTree } from "@features/tournament/components/bracket-tree";
import { PublicMatchCard } from "@features/tournament/components/public-match-card";
import { useBracketPlayback, type CurrentPlayback } from "@features/tournament/hooks/use-bracket-playback";
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
    <div className="grid min-w-0 gap-8">
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

function OpenBracket({ bracket: latest }: Readonly<{ bracket: PublicBracket }>) {
  const [showTree, setShowTree] = useState(false);
  const { displayed: bracket, current } = useBracketPlayback(latest);

  return (
    <>
      {bracket.phase === "finished" && !current && (
        <p role="status" className="border border-accent p-4 type-mono font-bold">
          {bracket.championTag ? COPY.champion(bracket.championTag) : COPY.noChampion}
        </p>
      )}
      <ViewToggle showTree={showTree} onToggle={() => setShowTree((current) => !current)} />
      <LiveMatches bracket={bracket} />
      <TreeView bracket={bracket} showTree={showTree} playback={current} />
      <ListView bracket={bracket} showTree={showTree} />
    </>
  );
}

// The tree is wide: on a phone the list stays the default and this button shows the tree, which scrolls sideways inside its
// own box so the page never does. From 900 px on the tree is always shown and the button disappears.
function ViewToggle({ showTree, onToggle }: Readonly<{ showTree: boolean; onToggle: () => void }>) {
  return (
    <div className="grid justify-items-start gap-2 min-[900px]:hidden">
      <Button variant="outline" className="min-h-11" aria-pressed={showTree} onPress={onToggle}>
        {showTree ? COPY.publicBracket.tree.showList : COPY.publicBracket.tree.showTree}
      </Button>
      {showTree && <p className="type-tiny text-muted">{COPY.publicBracket.tree.scrollHint}</p>}
    </div>
  );
}

interface TreeViewProps {
  bracket: PublicBracket;
  showTree: boolean;
  playback: CurrentPlayback | null;
}

function TreeView({ bracket, showTree, playback }: Readonly<TreeViewProps>) {
  return (
    <div className={showTree ? "block min-w-0" : "hidden min-w-0 min-[900px]:block"}>
      <div className="overflow-x-auto pb-4">
        <div className="min-w-350">
          <BracketTree bracket={bracket} playback={playback} />
        </div>
      </div>
    </div>
  );
}

function ListView({ bracket, showTree }: Readonly<{ bracket: PublicBracket; showTree: boolean }>) {
  return (
    <div className={showTree ? "hidden" : "grid gap-8 min-[900px]:hidden"}>
      <AreaLinks />
      {MATCH_AREAS.map((area) => (
        <AreaSection key={area} area={area} bracket={bracket} />
      ))}
    </div>
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
