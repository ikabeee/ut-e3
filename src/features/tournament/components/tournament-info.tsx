import { ActionLink } from "@shared/components/action-link";
import { TOURNAMENT_COPY } from "@features/tournament/lib/tournament-copy";
import {
  BOARD_NUMBERS,
  MAX_ENTRANTS,
  MIN_ENTRANTS,
  PLAYERS_PER_BOARD,
  PRE_LIST_LIMIT,
} from "@features/tournament/lib/tournament-rules";
import { formatEventDate, formatTimeOfDay } from "@shared/lib/date-time";

/** The hours of `event_settings` as ISO instants; the page reads them and passes them, none is written here. */
export interface TournamentInfoSchedule {
  registrationOpensAt: string;
  checkInStartsAt: string;
  checkInEndsAt: string;
  onsiteStartsAt: string;
  onsiteEndsAt: string;
  bracketGeneratesAt: string;
}

interface TournamentInfoProps {
  schedule: TournamentInfoSchedule;
  /** Built by the page from the `visitors` links: registration binds a device to a passport (RF-18). */
  registerHref: string;
  passportHref: string;
}

const COPY = TOURNAMENT_COPY.ui.publicBracket.info;

/** When, how and how many for the KOF tournament, with the way in to the existing registration flow (S5). */
export function TournamentInfo({ schedule, registerHref, passportHref }: Readonly<TournamentInfoProps>) {
  return (
    <section aria-labelledby="tournament-info-heading" className="grid gap-6">
      <h2 id="tournament-info-heading" className="sr-only">
        {COPY.heading}
      </h2>
      <div className="grid gap-4 md:grid-cols-3">
        <WhenBlock schedule={schedule} />
        <HowBlock schedule={schedule} registerHref={registerHref} passportHref={passportHref} />
        <HowManyBlock />
      </div>
    </section>
  );
}

function WhenBlock({ schedule }: Readonly<Pick<TournamentInfoProps, "schedule">>) {
  const { when } = COPY;

  return (
    <InfoBlock id="tournament-info-when" heading={when.heading}>
      <p>{when.date(formatEventDate(schedule.checkInStartsAt, "numeric"))}</p>
      <p>{when.registrationOpens(formatEventDate(schedule.registrationOpensAt, "numeric"))}</p>
      <p>{when.checkIn(formatTimeOfDay(schedule.checkInStartsAt), formatTimeOfDay(schedule.checkInEndsAt))}</p>
      <p>{when.onsite(formatTimeOfDay(schedule.onsiteStartsAt), formatTimeOfDay(schedule.onsiteEndsAt))}</p>
      <p>{when.bracket(formatTimeOfDay(schedule.bracketGeneratesAt))}</p>
    </InfoBlock>
  );
}

function HowBlock({ schedule, registerHref, passportHref }: Readonly<TournamentInfoProps>) {
  const { how } = COPY;
  const totalMatches = MAX_ENTRANTS - 1;

  return (
    <InfoBlock id="tournament-info-how" heading={how.heading}>
      <p>{how.format(BOARD_NUMBERS.length, PLAYERS_PER_BOARD, totalMatches)}</p>
      <ol aria-label={how.stepsLabel} className="m-0 grid list-decimal gap-2 pl-5">
        <li>{how.steps.passport}</li>
        <li>{how.steps.list}</li>
        <li>{how.steps.checkIn(formatTimeOfDay(schedule.checkInStartsAt), formatTimeOfDay(schedule.checkInEndsAt))}</li>
      </ol>
      <div className="flex flex-wrap gap-2">
        <ActionLink href={registerHref} variant="primary">
          {how.register}
        </ActionLink>
        <ActionLink href={passportHref}>{how.passport}</ActionLink>
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
    <section aria-labelledby={id} className="grid content-start gap-3 border border-border p-4 text-sm">
      <h3 id={id} className="type-mono text-accent">
        {heading}
      </h3>
      {children}
    </section>
  );
}
