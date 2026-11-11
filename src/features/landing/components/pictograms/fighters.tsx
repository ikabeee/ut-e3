import {
  HIT_POSE,
  PUNCH_POSE,
  type Limb,
  type Point,
  type Pose,
} from "@features/landing/components/pictograms/fighter-poses";
import { beatStyle } from "@features/landing/lib/beat-style";

type Side = "left" | "right";

const GROUND = 190;

const BAR_WIDTH = 150;

const REMAINING_HEALTH = 0.72;

const SPARK_RAYS = 10;

const SPARK_POSITION = { x: 200, y: GROUND - 74 } as const;

const FIGHTER_CLASSES = {
  left: { front: "fill-foreground stroke-foreground", back: "fill-muted stroke-muted" },
  right: { front: "fill-accent stroke-accent", back: "fill-accent-deep stroke-accent-deep" },
} as const;

export function Fighters() {
  return (
    <svg aria-hidden="true" viewBox="0 0 400 200" className="block h-auto w-full">
      <HealthBars />
      <line x1="0" y1={GROUND} x2="400" y2={GROUND} strokeWidth="2" className="stroke-border" />
      <g transform={`translate(160 ${GROUND})`}>
        <g className="beat beat-from" style={beatStyle({ span: 0.5, from: "translateX(-24px)" })}>
          <Fighter pose={PUNCH_POSE} side="left" />
        </g>
      </g>
      <g transform={`translate(250 ${GROUND}) scale(-1 1)`}>
        <Fighter pose={HIT_POSE} side="right" />
      </g>
      <Spark />
    </svg>
  );
}

function HealthBars() {
  return (
    <>
      <rect x="30" y="14" width={BAR_WIDTH} height="12" className="fill-border" />
      <rect x="30" y="14" width={BAR_WIDTH} height="12" className="fill-foreground" />
      <rect x="220" y="14" width={BAR_WIDTH} height="12" className="fill-border" />
      <rect
        x="220"
        y="14"
        width={BAR_WIDTH * REMAINING_HEALTH}
        height="12"
        className="beat fill-accent beat-from"
        style={beatStyle({ at: 0.5, span: 0.5, from: `scaleX(${1 / REMAINING_HEALTH})`, origin: "left" })}
      />
    </>
  );
}

function Fighter({ pose, side }: Readonly<{ pose: Pose; side: Side }>) {
  const classes = FIGHTER_CLASSES[side];

  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <g className={classes.back}>
        <Arm limb={pose.backArm} />
        <Leg limb={pose.backLeg} />
      </g>
      <g className={classes.front}>
        <Leg limb={pose.frontLeg} />
        <polygon points={torsoPoints(pose)} strokeWidth="6" />
        <Segment from={pose.neck} to={pose.head} width={10} />
        <circle cx={pose.head[0]} cy={pose.head[1]} r="15" stroke="none" />
        <Arm limb={pose.frontArm} />
      </g>
    </g>
  );
}

function Arm({ limb }: Readonly<{ limb: Limb }>) {
  const [shoulder, elbow, hand] = limb;

  return (
    <>
      <Segment from={shoulder} to={elbow} width={13} />
      <Segment from={elbow} to={hand} width={11} />
      <circle cx={hand[0]} cy={hand[1]} r="8" stroke="none" />
    </>
  );
}

function Leg({ limb }: Readonly<{ limb: Limb }>) {
  const [hip, knee, ankle] = limb;

  return (
    <>
      <Segment from={hip} to={knee} width={17} />
      <Segment from={knee} to={ankle} width={13} />
    </>
  );
}

interface SegmentProps {
  from: Point;
  to: Point;
  width: number;
}

function Segment({ from, to, width }: Readonly<SegmentProps>) {
  return <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} strokeWidth={width} />;
}

function torsoPoints({ neck, hip }: Pose) {
  const [neckX, neckY] = neck;
  const [hipX, hipY] = hip;

  return `${neckX - 16},${neckY + 4} ${neckX + 16},${neckY + 4} ${hipX + 10},${hipY} ${hipX - 10},${hipY}`;
}

function Spark() {
  const rays = Array.from({ length: SPARK_RAYS }, (_, index) => rayPath(index)).join(" ");

  return (
    <g
      transform={`translate(${SPARK_POSITION.x} ${SPARK_POSITION.y})`}
      fill="none"
      strokeLinecap="round"
      className="stroke-foreground"
    >
      <g className="beat beat-from" style={beatStyle({ at: 0.5, span: 0.5, from: "scale(0)" })}>
        <path d={rays} strokeWidth="5" />
        <circle r="18" strokeWidth="3" />
      </g>
    </g>
  );
}

function rayPath(index: number) {
  const angle = (index / SPARK_RAYS) * Math.PI * 2;
  const reach = index % 2 === 0 ? 40 : 24;

  return `M0 0 L${(Math.cos(angle) * reach).toFixed(1)} ${(Math.sin(angle) * reach).toFixed(1)}`;
}
