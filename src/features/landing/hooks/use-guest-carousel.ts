import { useState } from "react";

/** 1 moves to the next guest (the badge enters from the right), -1 to the previous one (from the left). */
export type SwingDirection = 1 | -1;

interface GuestCarouselState {
  index: number;
  /** Grows on every move, so the swinging badge can be remounted to restart its animation. */
  moveCount: number;
  direction: SwingDirection;
}

const INITIAL_STATE: GuestCarouselState = { index: 0, moveCount: 0, direction: 1 };

/** Shows one guest at a time; previous and next wrap around. */
export function useGuestCarousel(count: number) {
  const [state, setState] = useState(INITIAL_STATE);

  function move(direction: SwingDirection) {
    setState((current) => ({
      index: wrapIndex(current.index + direction, count),
      moveCount: current.moveCount + 1,
      direction,
    }));
  }

  return { ...state, goPrevious: () => move(-1), goNext: () => move(1) };
}

function wrapIndex(index: number, count: number) {
  return (index + count) % count;
}
