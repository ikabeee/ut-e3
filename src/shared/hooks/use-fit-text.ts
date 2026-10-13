import { useLayoutEffect, type RefObject } from "react";

/** Margen para que la palabra más ancha no toque el borde. */
const SAFETY = 0.97;

/** Ancho de la palabra más ancha del título (cada palabra es un hijo del elemento). */
function measureWidestWord(element: HTMLElement) {
  let widest = 0;

  for (const word of element.children) {
    widest = Math.max(widest, word.getBoundingClientRect().width);
  }

  return widest;
}

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
    let pendingFrame = 0;

    const fit = () => {
      if (!isActive) {
        return;
      }

      // Se mide con el tamaño de la hoja de estilos, sin el ajuste anterior.
      element.style.fontSize = "";
      const maxFontSize = Number.parseFloat(getComputedStyle(element).fontSize);
      const available = element.parentElement?.clientWidth ?? 0;
      const widest = measureWidestWord(element);

      if (available > 0 && widest > available) {
        const fittedFontSize = (maxFontSize * available) / widest;
        element.style.fontSize = `${Math.floor(fittedFontSize * SAFETY)}px`;
      }
    };

    // `resize` llega muchas veces por segundo al girar o redimensionar la ventana, y cada medición
    // obliga al navegador a recalcular el layout: se mide una sola vez por cuadro.
    const scheduleFit = () => {
      cancelAnimationFrame(pendingFrame);
      pendingFrame = requestAnimationFrame(fit);
    };

    fit();
    document.fonts.ready.then(fit).catch(() => undefined);
    window.addEventListener("resize", scheduleFit);

    return () => {
      isActive = false;
      cancelAnimationFrame(pendingFrame);
      window.removeEventListener("resize", scheduleFit);
    };
  }, [ref, text]);
}
