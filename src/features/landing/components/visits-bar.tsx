import { beatStyle } from "@features/landing/lib/beat-style";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";

const FIRST_MILESTONE = 9;

const SECOND_MILESTONE = 18;

const FILL_BEATS = 6;

export function VisitsBar() {
  return (
    <div aria-hidden="true" className="w-full max-w-xs">
      <div className="h-3 bg-surface">
        <div
          className="h-full beat bg-accent beat-from"
          style={beatStyle({ span: FILL_BEATS, from: "scaleX(0)", origin: "left" })}
        />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-right">
        <Milestone visits={FIRST_MILESTONE} at={FILL_BEATS / 2} />
        <Milestone visits={SECOND_MILESTONE} at={FILL_BEATS} />
      </div>
    </div>
  );
}

interface MilestoneProps {
  visits: number;
  at: number;
}

function Milestone({ visits, at }: Readonly<MilestoneProps>) {
  const { rate } = LANDING_COPY.acts;

  return (
    <p className="m-0 flex flex-col items-end gap-1 type-tiny">
      <span className="text-muted">{rate.visits(visits)}</span>
      <span
        className="beat font-bold text-accent beat-from"
        style={beatStyle({ at, span: 1, from: "scale(0)", origin: "right" })}
      >
        {rate.ticketGain}
      </span>
    </p>
  );
}
