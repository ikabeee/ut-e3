"use client";

import { Button, Toolbar } from "@heroui/react";

interface PlanZoomControlsProps {
  zoomPercent: number;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onFit: () => void;
}

const CONTROL_CLASS =
  "h-[42px] w-[46px] rounded-none border-0 border-l border-border bg-background p-0 font-mono text-xl text-foreground transition-[background-color,color] duration-200 first:border-l-0 hover:bg-accent hover:text-background active:transform-none [--btn-edge:var(--border)] [--btn-fill:var(--accent)]";

/** Controles de zoom del croquis (`.zctl`): alejar, nivel, acercar y ajustar. */
export function PlanZoomControls({ zoomPercent, onZoomOut, onZoomIn, onFit }: Readonly<PlanZoomControlsProps>) {
  return (
    <Toolbar aria-label="Controles del mapa" className="flex items-stretch gap-0 border border-border bg-background p-0">
      <Button variant="tertiary" isIconOnly aria-label="Alejar" className={CONTROL_CLASS} onPress={onZoomOut}>
        −
      </Button>
      <span
        aria-live="polite"
        className="type-tiny grid min-w-[58px] place-items-center border-l border-border text-accent tabular-nums"
      >
        {zoomPercent}%
      </span>
      <Button variant="tertiary" isIconOnly aria-label="Acercar" className={CONTROL_CLASS} onPress={onZoomIn}>
        +
      </Button>
      <Button
        variant="tertiary"
        isIconOnly
        aria-label="Ajustar a la pantalla"
        className={CONTROL_CLASS}
        onPress={onFit}
      >
        <svg viewBox="0 0 20 20" aria-hidden="true" className="size-[18px]">
          <path d="M2 7V2h5M13 2h5v5M18 13v5h-5M7 18H2v-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="square" />
          <rect x={7} y={7} width={6} height={6} fill="currentColor" />
        </svg>
      </Button>
    </Toolbar>
  );
}
