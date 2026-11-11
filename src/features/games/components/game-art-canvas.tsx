"use client";

import { useEffect, useRef } from "react";
import { cn } from "@heroui/react";
import { ART_COLOR_VARIABLES, drawGameArt, type ArtLabels } from "@features/games/lib/game-art";
import type { GameKeyArt } from "@features/games/lib/types";

interface GameArtCanvasProps {
  art: GameKeyArt;
  labels: ArtLabels;
  className?: string;
}

const MAX_PIXEL_RATIO = 2;

/** Lienzo con el arte generado de un juego; se vuelve a dibujar si cambia de tamaño. */
export function GameArtCanvas({ art, labels, className }: Readonly<GameArtCanvasProps>) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { seed } = art;
  const [shapeColor, backgroundColor] = art.palette;
  const { stand, genre, members } = labels;

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) {
      return;
    }

    let isActive = true;
    const styles = getComputedStyle(document.documentElement);
    const draw = () => {
      const { width, height } = canvas.getBoundingClientRect();
      if (!isActive || width === 0) {
        return;
      }
      const pixelRatio = Math.min(MAX_PIXEL_RATIO, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(width * pixelRatio));
      canvas.height = Math.max(1, Math.round(height * pixelRatio));
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      drawGameArt(
        {
          ctx,
          width,
          height,
          resolveColor: (color) => styles.getPropertyValue(ART_COLOR_VARIABLES[color]).trim(),
          monoFontFamily: styles.getPropertyValue("--font-jetbrains-mono").trim() || "monospace",
        },
        { seed, palette: [shapeColor, backgroundColor] },
        { stand, genre, members },
      );
    };

    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    // Los datos de escáner usan la tipografía mono: se redibuja cuando termina de cargar.
    document.fonts.ready.then(draw).catch(() => undefined);

    return () => {
      isActive = false;
      observer.disconnect();
    };
  }, [seed, shapeColor, backgroundColor, stand, genre, members]);

  return <canvas ref={ref} aria-hidden="true" className={cn("block size-full", className)} />;
}
