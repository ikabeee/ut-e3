"use client";

import { useEffect, useState } from "react";
import { applyAdvance, applyDecision, diffResults, type ResultChange } from "@features/tournament/lib/bracket-changes";
import type { PublicBracket } from "@features/tournament/lib/public-bracket";
import { usePrefersReducedMotion } from "@shared/hooks/use-prefers-reduced-motion";

export type PlaybackPhase = "approach" | "decide" | "advance";

/** What the tree is playing right now. */
export interface CurrentPlayback extends ResultChange {
  phase: PlaybackPhase;
}

interface QueuedChange {
  change: ResultChange;
  /** The answer from before this result, to keep its match and its place in the next round as they were. */
  before: PublicBracket;
}

interface PlaybackState {
  seen: PublicBracket;
  queue: QueuedChange[];
  phase: PlaybackPhase;
}

const PHASE_MS: Record<PlaybackPhase, number> = { approach: 900, decide: 1000, advance: 800 };

const NEXT_PHASE: Record<PlaybackPhase, PlaybackPhase> = { approach: "decide", decide: "advance", advance: "approach" };

// With more than this many results waiting, each step takes half the time.
const LONG_QUEUE = 3;

/**
 * Turns the answers of the server into a show (S8): each new result becomes a step (approach the match, decide it, move
 * the winner on) and the steps play one after another, so results that arrive together are queued. `displayed` is the
 * bracket to draw: the latest answer, minus whatever the show has not reached yet.
 */
export function useBracketPlayback(target: PublicBracket) {
  const isReduced = usePrefersReducedMotion();
  const [state, setState] = useState<PlaybackState>({ seen: target, queue: [], phase: "approach" });

  // A new answer is compared with the previous one while rendering, so the first frame already holds the result back.
  if (state.seen !== target) {
    setState(enqueue(state, target, isReduced));
  }

  const head = state.queue[0];
  const isLongQueue = state.queue.length > LONG_QUEUE;

  // The timer restarts only when the step changes or the queue crosses the limit, not when one more result queues.
  useEffect(() => {
    if (!head) return;

    const timer = setTimeout(() => setState(advanceStep), PHASE_MS[state.phase] * (isLongQueue ? 0.5 : 1));

    return () => clearTimeout(timer);
  }, [head, state.phase, isLongQueue]);

  return {
    displayed: buildDisplayed(target, state),
    current: head ? { ...head.change, phase: state.phase } : null,
  };
}

function enqueue(state: PlaybackState, target: PublicBracket, isReduced: boolean): PlaybackState {
  if (isReduced) return { seen: target, queue: [], phase: "approach" };

  const added = diffResults(state.seen, target).map((change) => ({ change, before: state.seen }));

  return { ...state, seen: target, queue: [...state.queue, ...added] };
}

function advanceStep(state: PlaybackState): PlaybackState {
  const phase = NEXT_PHASE[state.phase];

  return phase === "approach" ? { ...state, queue: state.queue.slice(1), phase } : { ...state, phase };
}

function buildDisplayed(target: PublicBracket, state: PlaybackState): PublicBracket {
  if (state.queue.length === 0) return target;

  return state.queue.reduce(
    (displayed, item, index) => holdBack(displayed, item, index === 0 ? state.phase : "approach"),
    target,
  );
}

// The result is shown from the "decide" step of its turn and the winner in the next round from the "advance" step.
function holdBack(displayed: PublicBracket, { change, before }: QueuedChange, phase: PlaybackPhase): PublicBracket {
  if (phase === "advance") return displayed;

  const withoutAdvance = applyAdvance(displayed, before, change);

  return phase === "decide" ? withoutAdvance : applyDecision(withoutAdvance, before, change.number);
}
