import type { CSSProperties } from "react";

export interface CoverflowCasePlacement {
  style: CSSProperties;
  isCurrent: boolean;
}

const FRONT_TRANSFORM = "translate3d(0px, 0, 0px) rotateY(0deg)";

export function getInitialCoverflowIndex(count: number): number {
  return Math.floor((count - 1) / 2);
}

export function getCoverflowPlacement(index: number, current: number): CoverflowCasePlacement {
  const offset = index - current;
  const isCurrent = offset === 0;
  const transform = isCurrent ? FRONT_TRANSFORM : getSideTransform(offset);

  return {
    isCurrent,
    style: { transform, zIndex: 100 - Math.abs(offset) },
  };
}

function getSideTransform(offset: number): string {
  const side = Math.sign(offset);
  const casesAfterFirst = Math.abs(offset) - 1;

  const shiftX = `calc(${side} * (var(--cw) * var(--gap-f) + ${casesAfterFirst} * var(--cw) * var(--step-f)))`;
  const depthZ = "calc(var(--cw) * var(--depth-f) * -1)";
  const turn = `calc(var(--angle) * ${-side})`;

  return `translate3d(${shiftX}, 0, ${depthZ}) rotateY(${turn})`;
}
