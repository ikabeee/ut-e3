import { useRef, type PointerEvent } from "react";

/** Horizontal distance, in px, from which a drag counts as a swipe. */
const SWIPE_DISTANCE = 40;

/** Movement, in px, up to which a press and release still counts as a tap. */
const TAP_TOLERANCE = 10;

interface BadgeSwipeActions {
  onPrevious: () => void;
  onNext: () => void;
}

interface Point {
  x: number;
  y: number;
}

/**
 * Pointer handlers that make the badge itself the control: a swipe to the left (or a tap) shows the next guest and a
 * swipe to the right the previous one. The surface must be `touch-pan-y`, so the page keeps scrolling vertically.
 */
export function useBadgeSwipe({ onPrevious, onNext }: BadgeSwipeActions) {
  const start = useRef<Point | null>(null);

  return {
    onPointerDown(event: PointerEvent) {
      start.current = event.button === 0 ? { x: event.clientX, y: event.clientY } : null;
    },
    onPointerUp(event: PointerEvent) {
      const origin = start.current;

      start.current = null;

      if (origin) {
        applyGesture(event.clientX - origin.x, event.clientY - origin.y, { onPrevious, onNext });
      }
    },
    onPointerCancel() {
      start.current = null;
    },
  };
}

function applyGesture(dx: number, dy: number, { onPrevious, onNext }: BadgeSwipeActions) {
  if (Math.abs(dx) >= SWIPE_DISTANCE && Math.abs(dx) > Math.abs(dy)) {
    (dx < 0 ? onNext : onPrevious)();
  } else if (Math.abs(dx) <= TAP_TOLERANCE && Math.abs(dy) <= TAP_TOLERANCE) {
    onNext();
  }
}
