import { useCallback, useRef, useState, type KeyboardEvent } from "react";
import { useSwipe } from "@shared/hooks/use-swipe";
import { wrapIndex } from "@shared/lib/carousel-index";

const SWIPE_THRESHOLD = 40;

const ARROW_STEPS = new Map([
  ["ArrowRight", 1],
  ["ArrowLeft", -1],
]);

// The gallery is circular: the arrows, a swipe and the keyboard on the thumbnails wrap at both ends.
export function useGallery(count: number) {
  const [activeIndex, setActiveIndex] = useState(0);
  const tabRefs = useRef<(HTMLElement | null)[]>([]);

  const showImage = useCallback((index: number) => setActiveIndex(wrapIndex(index, count)), [count]);
  const showPrevious = useCallback(() => setActiveIndex((index) => wrapIndex(index - 1, count)), [count]);
  const showNext = useCallback(() => setActiveIndex((index) => wrapIndex(index + 1, count)), [count]);
  const swipeHandlers = useSwipe((direction) => (direction === 1 ? showNext() : showPrevious()), SWIPE_THRESHOLD);

  const tabRef = useCallback(
    (index: number) => (element: HTMLElement | null) => {
      tabRefs.current[index] = element;
    },
    [],
  );

  // Only the selected thumbnail is tabbable, so the arrow keys move the focus along with the selection.
  const onTabKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const target = getKeyTarget(event.key, activeIndex, count);

    if (target === null) return;

    event.preventDefault();
    showImage(target);
    tabRefs.current[target]?.focus();
  };

  return { activeIndex, showImage, showPrevious, showNext, swipeHandlers, tabRef, onTabKeyDown };
}

function getKeyTarget(key: string, activeIndex: number, count: number): number | null {
  if (key === "Home") return 0;

  if (key === "End") return count - 1;

  const step = ARROW_STEPS.get(key);

  return step === undefined ? null : wrapIndex(activeIndex + step, count);
}
