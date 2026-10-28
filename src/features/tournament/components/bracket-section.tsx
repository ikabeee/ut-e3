import type { TournamentAction } from "@features/tournament/components/command-button";
import { MatchCard } from "@features/tournament/components/match-card";
import { TOURNAMENT_COPY } from "@features/tournament/lib/tournament-copy";
import { canRunCommand, type KofActor } from "@features/tournament/lib/tournament-rules";
import {
  getMatchPlayers,
  getStatusCounts,
  sortForCapture,
  type MatchSection,
} from "@features/tournament/lib/tournament-view";
import type { Tournament } from "@features/tournament/lib/types";

interface BracketSectionProps {
  section: MatchSection;
  tournament: Tournament;
  viewer: KofActor;
  action: TournamentAction;
  onApplied: () => void;
}

export function BracketSection({ section, tournament, viewer, action, onApplied }: Readonly<BracketSectionProps>) {
  const headingId = `section-${section.area}`;
  const finished = getStatusCounts(section.matches).finished;

  return (
    <section aria-labelledby={headingId} className="grid gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 id={headingId} className="type-section">
          {TOURNAMENT_COPY.areas[section.area]}
        </h3>
        <span className="type-tiny text-muted tabular-nums">
          {finished}/{section.matches.length}
        </span>
      </div>
      <ul className="m-0 grid list-none gap-3 p-0 md:grid-cols-2 xl:grid-cols-3">
        {sortForCapture(section.matches).map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            players={getMatchPlayers(tournament, match)}
            permissions={{
              canCapture: canRunCommand(viewer, "start_match", match),
              isAdmin: viewer.role === "kof_admin",
            }}
            action={action}
            onApplied={onApplied}
          />
        ))}
      </ul>
    </section>
  );
}
