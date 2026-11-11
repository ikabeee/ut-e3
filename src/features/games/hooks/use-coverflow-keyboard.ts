import { useCallback, useEffect, useRef, type KeyboardEvent } from "react";

interface CoverflowKeyboardOptions {
  current: number;
  goNext: () => void;
  goPrevious: () => void;
}

export function useCoverflowKeyboard({ current, goNext, goPrevious }: CoverflowKeyboardOptions) {
  const caseRefs = useRef<(HTMLElement | null)[]>([]);
  const focusCurrentAfterMove = useRef(false);

  useEffect(() => {
    if (focusCurrentAfterMove.current) {
      focusCurrentAfterMove.current = false;
      caseRefs.current[current]?.focus();
    }
  }, [current]);

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
      return;
    }

    focusCurrentAfterMove.current = true;

    if (event.key === "ArrowRight") {
      goNext();
    } else {
      goPrevious();
    }
  };

  const caseRef = useCallback(
    (index: number) => (element: HTMLElement | null) => {
      caseRefs.current[index] = element;
    },
    [],
  );

  return { onKeyDown, caseRef };
}
