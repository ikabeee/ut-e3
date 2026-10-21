import { LANDING_COPY } from "@features/landing/lib/landing-copy";

interface LandingGroupsStripProps {
  groups: readonly string[];
}

/** Banda oscura con los grupos participantes. */
export function LandingGroupsStrip({ groups }: Readonly<LandingGroupsStripProps>) {
  return (
    <ul
      aria-label={LANDING_COPY.groups.ariaLabel}
      className="page-wrap flex flex-wrap items-center justify-center gap-x-8 gap-y-3 rounded-[25px] bg-foreground py-5 text-background/77"
    >
      {groups.map((group) => (
        <li key={group} className="text-[1.4rem]">
          {group}
        </li>
      ))}
    </ul>
  );
}
