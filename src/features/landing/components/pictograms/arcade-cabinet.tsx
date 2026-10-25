import { useId } from "react";
import { LedCells } from "@features/landing/components/led-cells";
import { beatStyle } from "@features/landing/lib/beat-style";
import { layoutLedText } from "@features/landing/lib/led-text";

interface ArcadeCabinetProps {
  gamesCount: number;
}

const BODY =
  "M640 40 H1280 V170 L1250 186 V620 L1330 700 V760 L1262 784 V1040 H658 V784 L590 760 V700 L670 620 V186 L640 170 Z";

const BUTTON_CENTERS = [
  [1060, 728],
  [1112, 718],
  [1164, 728],
] as const;

const SCREEN = { x: 720, y: 210, width: 480, height: 360, cell: 12 } as const;

const DIGIT_PITCH = 24;

const COUNT_BEATS = 8;

const DIGITS = 2;

export function ArcadeCabinet({ gamesCount }: Readonly<ArcadeCabinetProps>) {
  const patternId = useId();

  return (
    <svg aria-hidden="true" viewBox="580 30 760 1020" className="block h-auto w-full">
      <Cabinet />
      <Screen patternId={patternId} gamesCount={gamesCount} />
    </svg>
  );
}

function Cabinet() {
  return (
    <>
      <path d={BODY} className="fill-foreground" />
      <rect
        x="672"
        y="66"
        width="576"
        height="78"
        rx="8"
        className="fill-accent drop-shadow-[0_0_18px_var(--accent)]"
      />
      <rect x="700" y="190" width="520" height="400" rx="14" className="fill-background" />
      <Controls />
      <rect x="866" y="846" width="188" height="150" rx="10" className="fill-background" />
      <rect x="914" y="884" width="16" height="40" rx="3" className="fill-accent" />
      <rect x="990" y="884" width="16" height="40" rx="3" className="fill-accent" />
    </>
  );
}

function Controls() {
  return (
    <>
      <line x1="800" y1="730" x2="800" y2="672" strokeWidth="12" strokeLinecap="round" className="stroke-background" />
      <circle cx="800" cy="666" r="20" className="fill-background" />
      <ellipse cx="800" cy="732" rx="34" ry="10" className="fill-background" />
      {BUTTON_CENTERS.map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r="15" className="fill-background" />
      ))}
    </>
  );
}

interface ScreenProps {
  patternId: string;
  gamesCount: number;
}

function Screen({ patternId, gamesCount }: Readonly<ScreenProps>) {
  const { x, y, width, height, cell } = SCREEN;

  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <pattern id={patternId} width={cell} height={cell} patternUnits="userSpaceOnUse">
          <rect x="1" y="1" width={cell - 2} height={cell - 2} className="fill-surface" />
        </pattern>
      </defs>
      <rect width={width} height={height} fill={`url(#${patternId})`} />
      <Counter gamesCount={gamesCount} />
    </g>
  );
}

function Counter({ gamesCount }: Readonly<ArcadeCabinetProps>) {
  const slotBeats = COUNT_BEATS / gamesCount;

  return Array.from({ length: gamesCount }, (_, index) => (
    <CounterSlot
      key={index + 1}
      number={index + 1}
      isLast={index + 1 === gamesCount}
      at={index * slotBeats}
      span={slotBeats}
    />
  ));
}

interface CounterSlotProps {
  number: number;
  isLast: boolean;
  at: number;
  span: number;
}

function CounterSlot({ number, isLast, at, span }: Readonly<CounterSlotProps>) {
  const { cells, columns, rows } = layoutLedText(String(number).padStart(DIGITS, "0"));
  const left = (SCREEN.width - columns * DIGIT_PITCH) / 2;
  const top = (SCREEN.height - rows * DIGIT_PITCH) / 2;
  const behaviour = isLast ? "beat-blink-in opacity-100" : "beat-blink-pass opacity-0";

  return (
    <g
      transform={`translate(${left} ${top})`}
      className={`beat fill-accent drop-shadow-[0_0_8px_var(--accent)] ${behaviour}`}
      style={beatStyle({ at, span })}
    >
      <LedCells cells={cells} pitch={DIGIT_PITCH} inset={1} />
    </g>
  );
}
