import { PassportActionLink } from "@features/tournament/components/passport-action-link";
import { TOURNAMENT_COPY } from "@features/tournament/lib/tournament-copy";
import {
  BOARD_NUMBERS,
  MAX_ENTRANTS,
  MIN_ENTRANTS,
  PLAYERS_PER_BOARD,
  PRE_LIST_LIMIT,
} from "@features/tournament/lib/tournament-rules";
import { getWhenGroups, type TournamentInfoSchedule } from "@features/tournament/lib/tournament-when";
import { formatTimeOfDay } from "@shared/lib/date-time";

interface TournamentInfoProps {
  schedule: TournamentInfoSchedule;
  /** Built by the page from the `visitors` links: registration binds a device to a passport (RF-18). */
  registerHref: string;
  passportHref: string;
  /** The key under which the phone keeps its passport copy; it decides which of the two links is shown (S30). */
  passportSnapshotKey: string;
}

const COPY = TOURNAMENT_COPY.ui.publicBracket.info;

/** When, how and how many for the KOF tournament, with the way in to the existing registration flow (S5). */
export function TournamentInfo({
  schedule,
  registerHref,
  passportHref,
  passportSnapshotKey,
}: Readonly<TournamentInfoProps>) {
  return (
    <section aria-labelledby="tournament-info-heading" className="mx-auto grid w-full max-w-5xl gap-6">
      <h2 id="tournament-info-heading" className="sr-only">
        {COPY.heading}
      </h2>
      <div className="grid gap-4 md:grid-cols-3">
        <WhenBlock schedule={schedule} />
        <HowBlock
          schedule={schedule}
          registerHref={registerHref}
          passportHref={passportHref}
          passportSnapshotKey={passportSnapshotKey}
        />
        <HowManyBlock />
      </div>
    </section>
  );
}

function WhenBlock({ schedule }: Readonly<Pick<TournamentInfoProps, "schedule">>) {
  return (
    <InfoBlock id="tournament-info-when" heading={COPY.when.heading}>
      {getWhenGroups(schedule).map((group) => (
        <div key={group.key} role="group" aria-labelledby={`tournament-when-${group.key}`} className="grid gap-1">
          <h4 id={`tournament-when-${group.key}`} className="font-bold">
            {group.label}
          </h4>
          {group.items.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
      ))}
    </InfoBlock>
  );
}

function HowBlock({ schedule, registerHref, passportHref, passportSnapshotKey }: Readonly<TournamentInfoProps>) {
  const { how } = COPY;
  const totalMatches = MAX_ENTRANTS - 1;

  return (
    <InfoBlock id="tournament-info-how" heading={how.heading}>
      <p>{how.format(BOARD_NUMBERS.length, PLAYERS_PER_BOARD, totalMatches)}</p>
      <ol aria-label={how.stepsLabel} className="m-0 grid list-inside list-decimal gap-2 p-0">
        <li>{how.steps.passport}</li>
        <li>{how.steps.list}</li>
        <li>{how.steps.checkIn(formatTimeOfDay(schedule.checkInStartsAt), formatTimeOfDay(schedule.checkInEndsAt))}</li>
      </ol>
      <div className="flex flex-wrap justify-center gap-2">
        <PassportActionLink
          registerHref={registerHref}
          passportHref={passportHref}
          snapshotKey={passportSnapshotKey}
          registerLabel={how.register}
          passportLabel={how.passport}
        />
      </div>
    </InfoBlock>
  );
}

function HowManyBlock() {
  const { howMany } = COPY;

  return (
    <InfoBlock id="tournament-info-how-many" heading={howMany.heading}>
      <p>{howMany.cap(MAX_ENTRANTS)}</p>
      <p>{howMany.minimum(MIN_ENTRANTS)}</p>
      <p>{howMany.preList(PRE_LIST_LIMIT)}</p>
    </InfoBlock>
  );
}

interface InfoBlockProps {
  id: string;
  heading: string;
  children: React.ReactNode;
}

function InfoBlock({ id, heading, children }: Readonly<InfoBlockProps>) {
  return (
    <section
      aria-labelledby={id}
      className="grid content-start justify-items-center gap-3 border border-border p-4 text-center text-sm"
    >
      <h3 id={id} className="type-mono text-accent">
        {heading}
      </h3>
      {children}
    </section>
  );
}
