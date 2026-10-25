"use client";

import { useEffect, useRef, type SVGProps } from "react";

type FitSvgTextProps = SVGProps<SVGTextElement> & {
  maxWidth: number;
  children: string;
};

export function FitSvgText({ maxWidth, children, ...textProps }: Readonly<FitSvgTextProps>) {
  const textRef = useRef<SVGTextElement>(null);

  useEffect(() => {
    const text = textRef.current;

    if (!text) {
      return;
    }

    let isActive = true;

    const fit = () => {
      if (isActive) {
        compressToWidth(text, maxWidth);
      }
    };

    fit();
    document.fonts.ready.then(fit).catch(() => undefined);

    return () => {
      isActive = false;
    };
  }, [maxWidth, children]);

  return (
    <text ref={textRef} {...textProps}>
      {children}
    </text>
  );
}

function compressToWidth(text: SVGTextElement, maxWidth: number) {
  text.removeAttribute("textLength");
  text.removeAttribute("lengthAdjust");

  const length = text.getComputedTextLength ? text.getComputedTextLength() : 0;

  if (length > maxWidth) {
    text.setAttribute("textLength", String(maxWidth));
    text.setAttribute("lengthAdjust", "spacingAndGlyphs");
  }
}
