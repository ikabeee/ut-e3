"use client";

import { useEffect, useRef, type SVGProps } from "react";

type FitSvgTextProps = SVGProps<SVGTextElement> & {
  /** Ancho máximo en unidades del SVG; si el texto mide más, se comprime. */
  maxWidth: number;
  children: string;
};

/**
 * Texto de SVG que se comprime para caber en su stand o zona (`textLength`).
 * Se vuelve a medir al cargar las tipografías y cuando el SVG cambia de tamaño o aparece.
 */
export function FitSvgText({ maxWidth, children, ...textProps }: Readonly<FitSvgTextProps>) {
  const ref = useRef<SVGTextElement>(null);

  useEffect(() => {
    const text = ref.current;
    if (!text) {
      return;
    }
    let isActive = true;
    const fit = () => {
      if (!isActive) {
        return;
      }
      text.removeAttribute("textLength");
      text.removeAttribute("lengthAdjust");
      // jsdom (pruebas) no implementa la medición de texto.
      const length = typeof text.getComputedTextLength === "function" ? text.getComputedTextLength() : 0;
      if (length > maxWidth) {
        text.setAttribute("textLength", String(maxWidth));
        text.setAttribute("lengthAdjust", "spacingAndGlyphs");
      }
    };

    fit();
    document.fonts.ready.then(fit).catch(() => undefined);
    const observer = new ResizeObserver(fit);
    if (text.ownerSVGElement) {
      observer.observe(text.ownerSVGElement);
    }
    return () => {
      isActive = false;
      observer.disconnect();
    };
  }, [maxWidth, children]);

  return (
    <text ref={ref} {...textProps}>
      {children}
    </text>
  );
}
