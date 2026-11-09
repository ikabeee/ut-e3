import Link from "next/link";
import { MODERATION_COPY } from "@features/moderation/lib/moderation-copy";
import type { FraudAlerts } from "@features/moderation/lib/types";
import { formatTimeOfDay } from "@shared/lib/date-time";

interface FraudAlertsPanelProps {
  alerts: FraudAlerts;
}

const COPY = MODERATION_COPY.alerts;

/** The two alerts of possible fraud as text (RF-45); each visitor links to its moderation below. */
export function FraudAlertsPanel({ alerts }: Readonly<FraudAlertsPanelProps>) {
  const { thresholds } = alerts;

  return (
    <section aria-labelledby="fraud-alerts-heading" className="grid gap-6">
      <div className="grid gap-2">
        <h2 id="fraud-alerts-heading" className="type-section">
          {COPY.heading}
        </h2>
        <p className="text-sm text-muted">
          {COPY.thresholds(thresholds.topScoreCount, thresholds.windowMinutes, thresholds.singleVisitMax)}
        </p>
      </div>
      <BurstList bursts={alerts.bursts} />
      <FewStandList visitors={alerts.fewStandVisitors} total={alerts.fewStandVisitorTotal} />
    </section>
  );
}

function BurstList({ bursts }: Readonly<{ bursts: FraudAlerts["bursts"] }>) {
  return (
    <div className="grid gap-3" data-testid="fraud-bursts">
      <h3 className="type-mono">{COPY.burstsHeading}</h3>
      {bursts.length === 0 ? (
        <p className="text-sm text-muted">{COPY.burstsEmpty}</p>
      ) : (
        <ul className="m-0 grid list-none gap-2 p-0">
          {bursts.map((burst) => (
            <li key={burst.standId} role="alert" className="border border-danger p-3 text-sm">
              <strong>{COPY.burst(burst.standCode, burst.count)}</strong>{" "}
              {COPY.burstLapse(formatTimeOfDay(burst.startsAt), formatTimeOfDay(burst.endsAt))}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FewStandList({ visitors, total }: Readonly<{ visitors: FraudAlerts["fewStandVisitors"]; total: number }>) {
  return (
    <div className="grid gap-3" data-testid="fraud-few-stands">
      <h3 className="type-mono">{COPY.fewStandHeading}</h3>
      {visitors.length === 0 ? (
        <p className="text-sm text-muted">{COPY.fewStandEmpty}</p>
      ) : (
        <ul className="m-0 grid list-none gap-2 p-0">
          {visitors.map((visitor) => (
            <li
              key={visitor.visitorId}
              className="flex flex-wrap items-center justify-between gap-3 border border-border p-3"
            >
              <span className="text-sm">
                {COPY.fewStandVisitor(visitor.gamertag, visitor.visitCount)}
                <span className="block type-tiny text-muted">{visitor.standCodes.join(", ")}</span>
              </span>
              <Link href={`?q=${encodeURIComponent(visitor.gamertag)}`} className="min-h-11 content-center link-wipe">
                {COPY.review}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {total > visitors.length ? (
        <p className="type-tiny text-muted">{COPY.fewStandMore(visitors.length, total)}</p>
      ) : null}
    </div>
  );
}
