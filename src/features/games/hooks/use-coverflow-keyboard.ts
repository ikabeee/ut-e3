import { useCallback, useEffect, useRef, type KeyboardEvent } from "react";

interface CoverflowKeyboardOptions {
  current: number;
  goNext: () => void;
  goPrevious: () => void;
  /** Abre la caja del frente (Espacio sobre una caja; Enter lo resuelve el enlace). */
  onOpenCurrent: () => void;
}

/**
 * Teclado y foco del exhibidor 3D: las flechas giran el exhibidor y el foco sigue a la caja del
 * frente; Espacio la abre. Quien lo usa decide cómo abrirla (por ejemplo, con el router).
 */
export function useCoverflowKeyboard({ current, goNext, goPrevious, onOpenCurrent }: CoverflowKeyboardOptions) {
  const caseRefs = useRef<(HTMLElement | null)[]>([]);
  const focusCurrentAfterMove = useRef(false);

  // Al moverse con el teclado, el foco sigue a la caja del frente.
  useEffect(() => {
    if (focusCurrentAfterMove.current) {
      focusCurrentAfterMove.current = false;
      caseRefs.current[current]?.focus();
    }
  }, [current]);

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === " " && event.target instanceof HTMLAnchorElement) {
      event.preventDefault();
      onOpenCurrent();
    } else if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      focusCurrentAfterMove.current = true;

      if (event.key === "ArrowRight") {
        goNext();
      } else {
        goPrevious();
      }
    }
  };

  /** Ref de la caja en la posición `index`, para poder enfocarla. */
  const caseRef = useCallback(
    (index: number) => (element: HTMLElement | null) => {
      caseRefs.current[index] = element;
    },
    [],
  );

  return { onKeyDown, caseRef };
}
