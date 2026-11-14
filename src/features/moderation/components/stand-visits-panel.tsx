import { Button } from "@heroui/react";
import Link from "next/link";
import type { ModerationAction } from "@features/moderation/components/reason-action-form";
import { SelectionModerationForm } from "@features/moderation/components/selection-moderation-form";
import { MODERATION_COPY } from "@features/moderation/lib/moderation-copy";
import { STAND_VISITS_CSV_PATH } from "@features/moderation/lib/moderation-links";
import { buildStandSelectableVisit, describeRatings } from "@features/moderation/lib/selectable-visit";
import type { ModerationStand, StandVisit } from "@features/moderation/lib/types";
import { formatTimeOfDay } from "@shared/lib/date-time";

interface StandVisitsPanelProps {
  stands: readonly ModerationStand[];
  /** The stand that was chosen, if any; its visits arrive in `visits`. */
  standId: string;
  visits: readonly StandVisit[] | undefined;
  limit: number;
  action: ModerationAction;
}

const COPY = MODERATION_COPY.byStand;

/** The "Por stand" view: pick a stand, see who visited it and who recorded it, tick visits to review, export CSV. */
export function StandVisitsPanel({ stands, standId, visits, limit, action }: Readonly<StandVisitsPanelProps>) {
  return (
    <section aria-labelledby="stand-visits-heading" className="grid gap-4">
      <div className="grid gap-2">
        <h2 id="stand-visits-heading" className="type-section">
          {COPY.heading}
        </h2>
        <p className="text-sm text-muted">{COPY.lead}</p>
      </div>
      <form method="get" className="flex flex-wrap items-end gap-3">
        <label className="grid max-w-sm grow gap-1 text-sm">
          {COPY.label}
          <select
            name="stand"
            defaultValue={standId}
            className="min-h-11 border border-border bg-surface px-3 text-base"
          >
            <option value="">{COPY.placeholder}</option>
            {stands.map((stand) => (
              <option key={stand.id} value={stand.id}>
                {stand.code}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" variant="primary" className="min-h-11">
          {COPY.submit}
        </Button>
      </form>
      {visits ? <StandVisitsResult standId={standId} visits={visits} limit={limit} action={action} /> : null}
    </section>
  );
}

interface StandVisitsResultProps {
  standId: string;
  visits: readonly StandVisit[];
  limit: number;
  action: ModerationAction;
}

function StandVisitsResult({ standId, visits, limit, action }: Readonly<StandVisitsResultProps>) {
  const selectable = visits.filter((visit) => visit.status === "valid").map(buildStandSelectableVisit);

  return (
    <div className="grid gap-4" data-testid="stand-visits">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm">{COPY.summary(visits.length)}</p>
        <a
          href={`${STAND_VISITS_CSV_PATH}?stand=${encodeURIComponent(standId)}`}
          className="min-h-11 content-center link-wipe"
          download
        >
          {COPY.exportCsv}
        </a>
      </div>
      {visits.length === 0 ? <p className="text-sm text-muted">{COPY.empty}</p> : null}
      {visits.length >= limit ? <p className="type-tiny text-muted">{COPY.truncated(limit)}</p> : null}
      {visits.length > 0 ? <VisitsTable visits={visits} /> : null}
      {selectable.length > 0 ? <SelectionModerationForm visits={selectable} action={action} /> : null}
    </div>
  );
}

function VisitsTable({ visits }: Readonly<{ visits: readonly StandVisit[] }>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="type-tiny">
            {Object.values(COPY.columns).map((label) => (
              <th key={label} scope="col" className="border-b border-border p-2">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visits.map((visit) => (
            <VisitTableRow key={visit.checkInId} visit={visit} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VisitTableRow({ visit }: Readonly<{ visit: StandVisit }>) {
  return (
    <tr>
      <td className="border-b border-border p-2">
        <Link href={`?q=${encodeURIComponent(visit.gamertag)}`} className="link-wipe">
          {visit.gamertag}
        </Link>
      </td>
      <td className="border-b border-border p-2">{formatTimeOfDay(visit.at)}</td>
      <td className="border-b border-border p-2">{visit.recordedBy ?? COPY.notRecorded}</td>
      <td className="border-b border-border p-2">{visit.ratings ? describeRatings(visit.ratings) : COPY.noVote}</td>
      <td className="border-b border-border p-2">{COPY.status[visit.status]}</td>
    </tr>
  );
}
