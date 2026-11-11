import type { PassportStand } from "@features/visitors/lib/types";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";

interface PassportStandsProps {
  stands: PassportStand[];
}

const COPY = VISITORS_COPY.passport.stands;

const VISITED_CLASS = "flex flex-col gap-1 border border-accent bg-surface p-3 text-foreground";

const PENDING_CLASS = "flex flex-col gap-1 border border-border bg-surface p-3 text-muted";

export function PassportStands({ stands }: Readonly<PassportStandsProps>) {
  const visitedCount = stands.filter((stand) => stand.visited).length;

  return (
    <section className="flex w-full max-w-sm flex-col gap-3">
      <header className="flex items-baseline justify-between gap-4">
        <h2 className="type-tiny text-foreground">{COPY.title}</h2>
        <p className="type-tiny text-muted">{COPY.summary(visitedCount, stands.length)}</p>
      </header>

      <ul className="grid grid-cols-3 gap-2">
        {stands.map((stand) => (
          <li key={stand.code} className={stand.visited ? VISITED_CLASS : PENDING_CLASS}>
            <span className="type-mono">{stand.code}</span>
            <span className="type-tiny">{stand.visited ? COPY.visited : COPY.pending}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
