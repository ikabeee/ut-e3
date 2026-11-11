"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@heroui/react";
import { usePrefersReducedMotion } from "@shared/hooks/use-prefers-reduced-motion";
import { SCRAMBLE_FRAME_MS, SCRAMBLE_FRAMES, scrambleFrame } from "@shared/lib/scramble";

interface ScrambleTextProps {
  text: string;
  className?: string;
}

/**
 * Etiqueta que se "decodifica" cuando el mouse entra al enlace o botón que la contiene.
 * Los lectores de pantalla siempre leen el texto real.
 */
export function ScrambleText({ text, className }: Readonly<ScrambleTextProps>) {
  const ref = useRef<HTMLSpanElement>(null);
  const [scrambled, setScrambled] = useState<string | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const host = ref.current?.closest("a, button");
    if (!host || prefersReducedMotion) {
      return;
    }

    let timer: number | undefined;
    const startScramble = () => {
      window.clearInterval(timer);
      let frame = 0;
      timer = window.setInterval(() => {
        frame += 1;
        if (frame >= SCRAMBLE_FRAMES) {
          window.clearInterval(timer);
          setScrambled(null);
          return;
        }
        setScrambled(scrambleFrame(text, frame));
      }, SCRAMBLE_FRAME_MS);
    };

    host.addEventListener("mouseenter", startScramble);
    return () => {
      host.removeEventListener("mouseenter", startScramble);
      window.clearInterval(timer);
    };
  }, [text, prefersReducedMotion]);

  return (
    <span ref={ref} className={cn("whitespace-pre", className)}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{scrambled ?? text}</span>
    </span>
  );
}
