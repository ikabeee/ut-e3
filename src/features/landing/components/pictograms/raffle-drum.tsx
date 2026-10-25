import { useId } from "react";
import { beatStyle } from "@features/landing/lib/beat-style";

const CENTER = { x: 300, y: 290 } as const;

const DRUM = "M300 100 L465 195 L465 385 L300 480 L135 385 L135 195 Z";

const TICKET = "M6 18h52v9a5 5 0 0 0 0 10v9H6v-9a5 5 0 0 0 0-10z";

const TUMBLING_TICKETS = 7;

const RAY_COUNT = 7;

export function RaffleDrum() {
  const clipId = useId();

  return (
    <svg aria-hidden="true" viewBox="0 -150 600 750" className="block h-auto w-full">
      <defs>
        <clipPath id={clipId}>
          <circle cx={CENTER.x} cy={CENTER.y} r="115" />
        </clipPath>
      </defs>
      <Stand />
      <path d={DRUM} className="fill-foreground" />
      <circle cx={CENTER.x} cy={CENTER.y} r="115" className="fill-background" />
      <g clipPath={`url(#${clipId})`}>
        <g className="beat fill-accent beat-from" style={beatStyle({ span: 4, from: "rotate(-240deg)" })}>
          <TumblingTickets />
        </g>
      </g>
      <rect x="262" y="118" width="76" height="16" rx="6" className="fill-background" />
      <WinningTicket />
    </svg>
  );
}

function Stand() {
  return (
    <g strokeLinecap="round" className="fill-foreground stroke-foreground">
      <line x1="210" y1="440" x2="170" y2="570" strokeWidth="22" />
      <line x1="390" y1="440" x2="430" y2="570" strokeWidth="22" />
      <rect x="120" y="562" width="360" height="22" rx="6" stroke="none" />
      <line x1="465" y1={CENTER.y} x2="505" y2={CENTER.y} strokeWidth="16" />
      <g
        className="beat beat-from"
        style={beatStyle({ span: 4, from: "rotate(-360deg)", origin: `505px ${CENTER.y}px`, box: "view-box" })}
      >
        <line x1="505" y1={CENTER.y} x2="549" y2={CENTER.y} strokeWidth="14" />
        <circle cx="549" cy={CENTER.y} r="15" stroke="none" />
      </g>
    </g>
  );
}

function TumblingTickets() {
  return Array.from({ length: TUMBLING_TICKETS }, (_, index) => {
    const angle = (index / TUMBLING_TICKETS) * 360;
    const radius = 40 + ((index * 37) % 45);
    const x = CENTER.x + Math.cos((angle * Math.PI) / 180) * radius;
    const y = CENTER.y + Math.sin((angle * Math.PI) / 180) * radius;

    return (
      <path
        key={angle}
        d={TICKET}
        transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${angle * 1.5}) scale(1.1) translate(-32 -32)`}
      />
    );
  });
}

function WinningTicket() {
  return (
    <g transform="translate(300 26) rotate(-6)">
      <g
        className="beat beat-from"
        style={beatStyle({ at: 1, span: 1.5, from: "translateY(70px) scale(0.5)", fromOpacity: 0 })}
      >
        <path d={TICKET} transform="scale(3.4) translate(-32 -32)" className="fill-accent" />
      </g>
      <g className="beat beat-from" style={beatStyle({ at: 2.5, span: 1, from: "scale(0)" })}>
        <Rays />
      </g>
    </g>
  );
}

function Rays() {
  const spokes = Array.from({ length: RAY_COUNT }, (_, index) => {
    const angle = ((180 + index * 30) * Math.PI) / 180;
    const [cos, sin] = [Math.cos(angle), Math.sin(angle)];

    return `M${(cos * 105).toFixed(1)} ${(sin * 105).toFixed(1)} L${(cos * 170).toFixed(1)} ${(sin * 170).toFixed(1)}`;
  });

  return <path d={spokes.join(" ")} strokeWidth="10" strokeLinecap="round" className="stroke-foreground" />;
}
