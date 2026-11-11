import { beatStyle } from "@features/landing/lib/beat-style";

const STARS = 5;

const STAR_GAP = 68;

const STAR_Y = 400;

const STAR_STEP_BEATS = 0.5;

const STAR_PATH =
  "M0 -30 L8.8 -12.1 L28.5 -9.3 L14.3 4.6 L17.6 24.3 L0 15 L-17.6 24.3 L-14.3 4.6 L-28.5 -9.3 L-8.8 -12.1 Z";

export function RatePhone() {
  return (
    <svg aria-hidden="true" viewBox="0 0 400 800" className="block h-auto w-full">
      <rect width="400" height="800" rx="56" className="fill-foreground" />
      <rect x="20" y="60" width="360" height="680" rx="32" className="fill-background" />
      <rect x="160" y="26" width="80" height="14" rx="7" className="fill-background" />
      {Array.from({ length: STARS }, (_, index) => (
        <Star key={index} index={index} />
      ))}
    </svg>
  );
}

function Star({ index }: Readonly<{ index: number }>) {
  const x = 200 + (index - (STARS - 1) / 2) * STAR_GAP;

  return (
    <g transform={`translate(${x} ${STAR_Y}) scale(0.95)`}>
      <path
        d={STAR_PATH}
        strokeWidth="3"
        className="beat fill-accent stroke-accent beat-unlit"
        style={beatStyle({ at: index * STAR_STEP_BEATS, span: 1 })}
      />
    </g>
  );
}
