import type { ReactNode } from "react";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";
import { PaperCard } from "@shared/components/paper-card";

interface RaffleSchedule {
  startsAtLabel: string;
  cutoffLabel: string;
}

interface KofSchedule {
  opensAtLabel: string;
  closesAtLabel: string;
}

interface ActivityCardsProps {
  raffle: RaffleSchedule;
  kof: KofSchedule;
  marketplace: ReactNode;
}

interface ActivityFact {
  label: string;
  value: string;
}

interface ActivityCardProps {
  kicker: string;
  title: string;
  body: string;
  facts: ActivityFact[];
  children?: ReactNode;
}

export function ActivityCards({ raffle, kof, marketplace }: Readonly<ActivityCardsProps>) {
  const { activities } = LANDING_COPY;

  return (
    <div className="mt-[clamp(48px,6vw,80px)] grid grid-cols-2 gap-gutter max-[820px]:grid-cols-1">
      <ActivityCard
        kicker={activities.raffle.kicker}
        title={activities.raffle.title}
        body={activities.raffle.body(raffle.cutoffLabel)}
        facts={[
          { label: activities.raffle.startsAt, value: raffle.startsAtLabel },
          { label: activities.raffle.maximum, value: activities.raffle.maximumValue },
        ]}
      />
      <ActivityCard
        kicker={activities.marketplace.kicker}
        title={activities.marketplace.title}
        body={activities.marketplace.body}
        facts={[{ label: activities.marketplace.kind, value: activities.marketplace.kindValue }]}
      >
        {marketplace}
      </ActivityCard>
      <ActivityCard
        kicker={activities.kof.kicker}
        title={activities.kof.title}
        body={activities.kof.body}
        facts={[
          { label: activities.kof.format, value: activities.kof.formatValue },
          { label: activities.kof.opensAt, value: kof.opensAtLabel },
          { label: activities.kof.closesAt, value: kof.closesAtLabel },
        ]}
      />
      <ActivityCard
        kicker={activities.marioKart.kicker}
        title={activities.marioKart.title}
        body={activities.marioKart.body}
        facts={[{ label: activities.marioKart.kind, value: activities.marioKart.kindValue }]}
      />
    </div>
  );
}

function ActivityCard({ kicker, title, body, facts, children }: Readonly<ActivityCardProps>) {
  return (
    <article className="flex min-w-0 flex-col">
      <PaperCard className="flex-1 gap-3 px-[22px] pt-[22px] pb-7">
        <span className="type-tiny">{kicker}</span>
        <h3 className="font-wide text-[clamp(24px,2.6vw,34px)] leading-[.95] font-bold tracking-[-.03em] uppercase">
          {title}
        </h3>
        <p className="m-0 max-w-[40ch] text-lg leading-[1.2]">{body}</p>
        <FactList facts={facts} />
        {children}
      </PaperCard>
    </article>
  );
}

function FactList({ facts }: Readonly<Pick<ActivityCardProps, "facts">>) {
  return (
    <dl className="mt-2 mb-0 grid grid-cols-3 gap-[10px] border-t border-paper-rule pt-3">
      {facts.map((fact) => (
        <div key={fact.label}>
          <dt className="font-mono text-[11px] text-muted uppercase">{fact.label}</dt>
          <dd className="m-0 mt-0.5 font-mono text-sm font-bold uppercase">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}
