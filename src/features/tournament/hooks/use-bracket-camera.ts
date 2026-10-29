"use client";

import { useEffect, type RefObject } from "react";
import type { CurrentPlayback } from "@features/tournament/hooks/use-bracket-playback";

const MATCH_ZOOM = 2.2;

// While the winner moves on, the camera backs off a little to keep both matches in frame.
const ADVANCE_ZOOM = 1.7;

const CAMERA_TRANSITION =
  "transform 0.7s cubic-bezier(0.4, 0, 0.2, 1), transform-origin 0.7s cubic-bezier(0.4, 0, 0.2, 1)";

/**
 * The camera of the show (S8): zooms the tree into the match being played, stays on it while the queue plays, follows the
 * winner to the next round and zooms out when there is nothing left to show. It moves the element by hand instead of
 * through state because it is only an effect on the screen, not something the page renders from.
 */
export function useBracketCamera(stageRef: RefObject<HTMLElement | null>, playback: CurrentPlayback | null) {
  const number = playback?.number;
  const isAdvancing = playback?.phase === "advance";
  const nextNumber = isAdvancing ? playback?.advance?.number : undefined;

  useEffect(() => {
    const stage = stageRef.current;

    if (!stage) return;

    stage.style.transition = CAMERA_TRANSITION;

    if (number === undefined) return zoomOut(stage);

    const focus = findMatch(stage, number);

    if (!focus) return;

    focus.scrollIntoView?.({ behavior: "smooth", block: "center", inline: "center" });
    zoomTo(stage, getFocusPoint(stage, focus, findMatch(stage, nextNumber)), isAdvancing ? ADVANCE_ZOOM : MATCH_ZOOM);
  }, [stageRef, number, nextNumber, isAdvancing]);
}

function zoomOut(stage: HTMLElement) {
  stage.style.transform = "scale(1)";
  stage.dataset.camera = "out";
}

function zoomTo(stage: HTMLElement, point: { x: number; y: number }, scale: number) {
  stage.style.transformOrigin = `${point.x}px ${point.y}px`;
  stage.style.transform = `scale(${scale})`;
  stage.dataset.camera = "in";
}

function findMatch(stage: HTMLElement, number: number | undefined): HTMLElement | null {
  return number === undefined ? null : stage.querySelector<HTMLElement>(`[data-number="${number}"]`);
}

// The point in the stage, before any zoom, that the camera keeps still: the middle of the match, or between two matches.
function getFocusPoint(stage: HTMLElement, match: HTMLElement, other: HTMLElement | null) {
  const first = getCenter(stage, match);

  if (!other) return first;

  const second = getCenter(stage, other);

  return { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
}

// `offsetLeft` and `offsetTop` ignore transforms, so the answer is the same at any zoom.
function getCenter(stage: HTMLElement, element: HTMLElement) {
  let x = element.offsetWidth / 2;
  let y = element.offsetHeight / 2;

  let node: Element | null = element;

  while (node instanceof HTMLElement && node !== stage) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent;
  }

  return { x, y };
}
