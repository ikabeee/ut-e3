import { TournamentEmblem } from "@features/tournament/components/tournament-emblem";
import { TOURNAMENT_COPY } from "@features/tournament/lib/tournament-copy";

/** The title of /tournament with the emblem of the event next to it. */
export function TournamentHeading() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 text-center">
      <TournamentEmblem className="size-12 shrink-0 text-accent min-[900px]:size-16" />
      <h1 className="type-section">{TOURNAMENT_COPY.ui.publicBracket.title}</h1>
    </div>
  );
}
