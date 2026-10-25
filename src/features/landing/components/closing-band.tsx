import { LANDING_COPY } from "@features/landing/lib/landing-copy";
import { siteConfig } from "@shared/lib/site-config";

interface ClosingBandProps {
  dateLabel: string;
}

export function ClosingBand({ dateLabel }: Readonly<ClosingBandProps>) {
  const { closing } = LANDING_COPY;

  return (
    <div className="mt-[clamp(100px,12vw,180px)] bg-accent text-background">
      <div className="page-wrap flex flex-wrap items-end justify-between gap-6 py-[clamp(32px,4vw,56px)]">
        <h2 className="type-giant text-[clamp(34px,7.4vw,112px)]!">
          {closing.firstLine}
          <br />
          {closing.secondLine}
        </h2>
        <span className="type-mono">
          {dateLabel} · {siteConfig.organization.universityShortName}
        </span>
      </div>
    </div>
  );
}
