export type RoadTone = "asphalt" | "curb-light" | "curb-dark" | "stripe";

export interface RoadPiece {
  key: string;
  points: string;
  tone: RoadTone;
}

interface RoadSlice {
  y: number;
  half: number;
  center: number;
}

const WIDTH = 400;

const HEIGHT = 225;

const HORIZON = 80;

const SEGMENTS = 22;

export function buildRoad(curve: number): RoadPiece[] {
  return Array.from({ length: SEGMENTS }, (_, depth) => SEGMENTS - 1 - depth).flatMap((depth) => {
    const near = sliceAt(1 + depth, curve);
    const far = sliceAt(2 + depth, curve);
    const isLight = depth % 2 === 0;
    const curb = isLight ? "curb-light" : "curb-dark";

    return [
      piece(`${depth}-road`, [near, far, -1, 1], "asphalt"),
      piece(`${depth}-left`, [near, far, -1.12, -1], curb),
      piece(`${depth}-right`, [near, far, 1, 1.12], curb),
      ...(isLight ? [piece(`${depth}-stripe`, [near, far, -0.03, 0.03], "stripe" as const)] : []),
    ];
  });
}

function sliceAt(distance: number, curve: number): RoadSlice {
  const inverse = 1 / distance;

  return {
    y: HORIZON + (HEIGHT - HORIZON) * inverse,
    half: 8 + 210 * inverse,
    center: WIDTH / 2 + curve * (1 - inverse) ** 2 * 110,
  };
}

function piece(key: string, band: [RoadSlice, RoadSlice, number, number], tone: RoadTone): RoadPiece {
  const [near, far, from, to] = band;

  const corners = [
    [near.center + near.half * from, near.y],
    [near.center + near.half * to, near.y],
    [far.center + far.half * to, far.y],
    [far.center + far.half * from, far.y],
  ];

  return {
    key,
    points: corners.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" "),
    tone,
  };
}
