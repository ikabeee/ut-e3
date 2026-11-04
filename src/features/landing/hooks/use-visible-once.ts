import { useEffect, useRef, useState, type RefObject } from "react";

const PRELOAD_MARGIN = "200px";

/** Turns true, and stays true, once the element is about to scroll into view. Without IntersectionObserver it stays false. */
export function useVisibleOnce<Element extends HTMLElement>(): [RefObject<Element | null>, boolean] {
  const ref = useRef<Element>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;

    if (!element || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: PRELOAD_MARGIN },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return [ref, isVisible];
}
