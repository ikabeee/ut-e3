import { Button, Input, Label, TextField } from "@heroui/react";
import { ReasonActionForm, type ModerationAction } from "@features/moderation/components/reason-action-form";
import { MODERATION_COPY } from "@features/moderation/lib/moderation-copy";
import type { ModerationCheckIn, ModerationTicket, ModerationVisitor } from "@features/moderation/lib/types";
import { formatTimeOfDay } from "@shared/lib/date-time";

export interface ModerationActions {
  annul: ModerationAction;
  exclude: ModerationAction;
}

interface VisitorModerationProps {
  query: string;
  /** Null when there was a query and nothing matched; undefined when nothing was searched yet. */
  visitor: ModerationVisitor | null | undefined;
  actions: ModerationActions;
}

const COPY = MODERATION_COPY;

/** The search of a passport and, when found, its visits and tickets with the forms to annul or exclude (RF-46). */
export function VisitorModeration({ query, visitor, actions }: Readonly<VisitorModerationProps>) {
  return (
    <section aria-labelledby="visitor-moderation-heading" className="grid gap-6">
      <div className="grid gap-2">
        <h2 id="visitor-moderation-heading" className="type-section">
          {COPY.lookup.heading}
        </h2>
        <p className="text-sm text-muted">{COPY.lookup.lead}</p>
      </div>
      <form method="get" className="flex flex-wrap items-end gap-3">
        <TextField name="q" defaultValue={query} className="max-w-sm grow">
          <Label>{COPY.lookup.label}</Label>
          <Input className="min-h-11 text-base" autoComplete="off" />
        </TextField>
        <Button type="submit" variant="primary" className="min-h-11">
          {COPY.lookup.submit}
        </Button>
      </form>
      {visitor === null ? <p className="text-sm text-muted">{COPY.lookup.notFound}</p> : null}
      {visitor ? <VisitorDetail visitor={visitor} actions={actions} /> : null}
    </section>
  );
}

function VisitorDetail({ visitor, actions }: Readonly<{ visitor: ModerationVisitor; actions: ModerationActions }>) {
  return (
    <article aria-label={visitor.gamertag} className="grid gap-6 border border-border p-4">
      <header className="grid gap-1">
        <h3 className="type-mono text-lg">{visitor.gamertag}</h3>
        <p className="text-sm text-muted">
          {visitor.fullName} · {COPY.visitor.summary(visitor.validVisitCount)}
        </p>
        {visitor.exclusion ? (
          <p role="status" className="text-sm text-danger">
            {COPY.visitor.excluded(visitor.exclusion.reason)}
          </p>
        ) : null}
      </header>
      <CheckInList checkIns={visitor.checkIns} annul={actions.annul} />
      <TicketList tickets={visitor.tickets} />
      {visitor.exclusion ? null : (
        <details className="border border-danger p-4">
          <summary className="min-h-11 cursor-pointer content-center type-mono">{COPY.forms.exclude}</summary>
          <div className="pt-4">
            <ReasonActionForm
              action={actions.exclude}
              target={{ name: "visitorId", value: visitor.id }}
              submitLabel={COPY.forms.excludeConfirm}
            />
          </div>
        </details>
      )}
    </article>
  );
}

function CheckInList({ checkIns, annul }: Readonly<{ checkIns: ModerationCheckIn[]; annul: ModerationAction }>) {
  return (
    <div className="grid gap-3">
      <h4 className="type-tiny">{COPY.visitor.checkInsHeading}</h4>
      {checkIns.length === 0 ? <p className="text-sm text-muted">{COPY.visitor.noCheckIns}</p> : null}
      <ul className="m-0 grid list-none gap-2 p-0">
        {checkIns.map((checkIn) => (
          <li key={checkIn.id} className="border border-border p-3" data-testid="moderation-check-in">
            <CheckInRow checkIn={checkIn} annul={annul} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function CheckInRow({ checkIn, annul }: Readonly<{ checkIn: ModerationCheckIn; annul: ModerationAction }>) {
  const title = `${checkIn.standCode} · ${formatTimeOfDay(checkIn.checkedInAt)}`;

  if (checkIn.annulment) {
    return (
      <p className="text-sm">
        <span className="text-muted line-through">{title}</span>
        <span className="block type-tiny text-danger">
          {COPY.visitor.annulled(checkIn.annulment.reason, checkIn.annulment.byName)}
        </span>
      </p>
    );
  }

  return (
    <details>
      <summary className="min-h-11 cursor-pointer content-center text-sm">{title}</summary>
      <div className="pt-3">
        <ReasonActionForm
          action={annul}
          target={{ name: "checkInId", value: checkIn.id }}
          submitLabel={COPY.forms.annulConfirm}
        />
      </div>
    </details>
  );
}

function TicketList({ tickets }: Readonly<{ tickets: ModerationTicket[] }>) {
  return (
    <div className="grid gap-2">
      <h4 className="type-tiny">{COPY.visitor.ticketsHeading}</h4>
      {tickets.length === 0 ? <p className="text-sm text-muted">{COPY.visitor.noTickets}</p> : null}
      <ul className="m-0 grid list-none gap-1 p-0 text-sm" data-testid="moderation-tickets">
        {tickets.map((ticket) => (
          <li key={ticket.number}>
            {COPY.visitor.ticket(ticket.number, ticket.milestone)}:{" "}
            <strong>{COPY.visitor.ticketStatus(ticket.status)}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
