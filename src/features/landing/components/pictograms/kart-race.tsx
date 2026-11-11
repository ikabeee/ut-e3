import { buildRoad, type RoadTone } from "@features/landing/components/pictograms/kart-road";
import { beatStyle } from "@features/landing/lib/beat-style";

const CURVE = 0.7;

const ROAD = buildRoad(CURVE);

const TONE_CLASSES: Record<RoadTone, string> = {
  asphalt: "fill-surface",
  "curb-light": "fill-foreground",
  "curb-dark": "fill-accent",
  stripe: "fill-foreground",
};

const SPARK_COUNT = 6;

export function KartRace() {
  return (
    <svg aria-hidden="true" viewBox="0 0 400 225" className="block h-auto w-full">
      <rect width="400" height="225" className="fill-background" />
      <line x1="0" y1="80" x2="400" y2="80" strokeWidth="1.5" className="stroke-accent" />
      <g className="beat beat-from" style={beatStyle({ span: 1, from: "translateY(24px)", fromOpacity: 0 })}>
        {ROAD.map((piece) => (
          <polygon key={piece.key} points={piece.points} className={TONE_CLASSES[piece.tone]} />
        ))}
      </g>
      <g transform={`translate(${200 - CURVE * 26} 196) rotate(${-CURVE * 7})`}>
        <g className="beat beat-from" style={beatStyle({ at: 0.5, span: 1, from: "translateY(60px)", fromOpacity: 0 })}>
          <DriftSparks />
          <Kart />
        </g>
      </g>
    </svg>
  );
}

function Kart() {
  return (
    <g className="fill-foreground">
      <rect x="-52" y="-22" width="20" height="32" rx="5" />
      <rect x="32" y="-22" width="20" height="32" rx="5" />
      <polygon points="-36,-2 36,-2 28,-24 -28,-24" />
      <rect x="-44" y="-36" width="88" height="7" rx="2" />
      <rect x="-3" y="-30" width="6" height="8" />
      <path d="M-24 -24 C-24 -40 -14 -46 0 -46 C14 -46 24 -40 24 -24 Z" />
      <circle cy="-56" r="14" />
    </g>
  );
}

function DriftSparks() {
  return (
    <g strokeWidth="2.5" className="stroke-accent">
      {Array.from({ length: SPARK_COUNT }, (_, index) => (
        <line key={index} x1="40" y1="8" x2={50 + index * 3} y2={2 + (index % 3) * 4} />
      ))}
    </g>
  );
}
