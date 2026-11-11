import { useLayoutEffect, type RefObject } from "react";

/** Margen para que la palabra más ancha no toque el borde. */
const SAFETY = 0.97;

/**
 * Reduce el tamaño de un título si su palabra más ancha (cada palabra en su `<span>`) no
 * cabe en el contenedor. Se recalcula al cambiar el texto, al redimensionar y al cargar
 * las tipografías (`fitTitle` del diseño).
 */
export function useFitText(ref: RefObject<HTMLElement | null>, text: string) {
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    let isActive = true;
    const fit = () => {
      if (!isActive) {
        return;
      }
      element.style.fontSize = "";
      const maxFontSize = Number.parseFloat(getComputedStyle(element).fontSize);
      const available = element.parentElement?.clientWidth ?? 0;
      const widest = Math.max(0, ...[...element.children].map((word) => word.getBoundingClientRect().width));
      if (available > 0 && widest > available) {
        element.style.fontSize = `${Math.floor(((maxFontSize * available) / widest) * SAFETY)}px`;
      }
    };

    fit();
    document.fonts.ready.then(fit).catch(() => undefined);
    window.addEventListener("resize", fit);
    return () => {
      isActive = false;
      window.removeEventListener("resize", fit);
    };
  }, [ref, text]);
}
