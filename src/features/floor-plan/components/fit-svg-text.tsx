"use client";

import { useEffect, useRef, type SVGProps } from "react";

type FitSvgTextProps = SVGProps<SVGTextElement> & {
  maxWidth: number;
  children: string;
};

// A long word first shrinks down to this share of its font size, and only then is squeezed, so it stays legible.
const MIN_FONT_SCALE = 0.75;

export function FitSvgText({ maxWidth, children, ...textProps }: Readonly<FitSvgTextProps>) {
  const textRef = useRef<SVGTextElement>(null);
  const baseSize = Number(textProps.fontSize);

  useEffect(() => {
    const text = textRef.current;

    if (!text) {
      return;
    }

    let isActive = true;

    const fit = () => {
      if (isActive) {
        compressToWidth(text, maxWidth, baseSize);
      }
    };

    fit();
    document.fonts.ready.then(fit).catch(() => undefined);

    return () => {
      isActive = false;
    };
  }, [maxWidth, children, baseSize]);

  return (
    <text ref={textRef} {...textProps}>
      {children}
    </text>
  );
}

function compressToWidth(text: SVGTextElement, maxWidth: number, baseSize: number) {
  text.removeAttribute("textLength");
  text.removeAttribute("lengthAdjust");

  if (Number.isFinite(baseSize)) text.setAttribute("font-size", String(baseSize));

  const length = measure(text);

  if (length <= maxWidth) return;

  if (Number.isFinite(baseSize)) {
    const scale = Math.max(maxWidth / length, MIN_FONT_SCALE);

    text.setAttribute("font-size", String(baseSize * scale));
  }

  if (measure(text) > maxWidth) {
    text.setAttribute("textLength", String(maxWidth));
    text.setAttribute("lengthAdjust", "spacingAndGlyphs");
  }
}

function measure(text: SVGTextElement): number {
  return text.getComputedTextLength ? text.getComputedTextLength() : 0;
}
