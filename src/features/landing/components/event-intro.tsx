import type { ReactNode } from "react";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";
import { EVENT_SECTION_ID } from "@features/landing/lib/landing-links";
import { siteConfig } from "@shared/lib/site-config";

interface EventIntroProps {
  children?: ReactNode;
}

export function EventIntro({ children }: Readonly<EventIntroProps>) {
  const { event } = LANDING_COPY;
  const { division, universityShortName } = siteConfig.organization;

  return (
    <section id={EVENT_SECTION_ID} className="section-block">
      <div className="page-wrap">
        <h2 className="type-giant">
          {event.firstLine}
          <br />
          {event.secondLine(universityShortName)}
        </h2>
        <div className="mt-9 grid grid-cols-2 items-end gap-gutter max-[820px]:grid-cols-1">
          <p className="m-0 max-w-[46ch] type-mono">{event.lead(division)}</p>
          <p className="m-0 max-w-[46ch] type-mono text-muted">{event.details}</p>
        </div>
        {children}
      </div>
    </section>
  );
}
