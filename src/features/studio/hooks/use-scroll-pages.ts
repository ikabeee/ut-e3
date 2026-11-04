import { useCallback, useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@shared/hooks/use-prefers-reduced-motion";

/**
 * The pages of a native horizontal scroll track: how many screens it holds and which one is showing, for the
 * pagination dots. A new `resetKey` (a new filter) goes back to the first page.
 */
export function useScrollPages<T extends HTMLElement>(resetKey: string | null) {
  const ref = useRef<T>(null);
  const [pageCount, setPageCount] = useState(1);
  const [currentPage, setCurrentPage] = useState(0);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const track = ref.current;

    if (!track) return;

    track.scrollTo({ left: 0 });

    return observeTrack(track, (pages, page) => {
      setPageCount(pages);
      setCurrentPage(page);
    });
  }, [resetKey]);

  const goToPage = useCallback(
    (page: number) => {
      const track = ref.current;

      track?.scrollTo({ left: page * track.clientWidth, behavior: prefersReducedMotion ? "auto" : "smooth" });
    },
    [prefersReducedMotion],
  );

  return { ref, pageCount, currentPage, goToPage };
}

function observeTrack(track: HTMLElement, onMeasure: (pages: number, page: number) => void): () => void {
  const measure = () => onMeasure(...measureTrack(track));
  const observer = new ResizeObserver(measure);

  measure();
  track.addEventListener("scroll", measure, { passive: true });
  observer.observe(track);

  return () => {
    track.removeEventListener("scroll", measure);
    observer.disconnect();
  };
}

function measureTrack(track: HTMLElement): [number, number] {
  const pageWidth = track.clientWidth || 1;
  const pages = Math.max(1, Math.ceil((track.scrollWidth - 1) / pageWidth));
  const isAtEnd = track.scrollLeft + pageWidth >= track.scrollWidth - 1;

  return [pages, isAtEnd ? pages - 1 : Math.round(track.scrollLeft / pageWidth)];
}
