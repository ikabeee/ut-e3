"use client";

import { Button, Toolbar } from "@heroui/react";
import { FLOOR_PLAN_COPY } from "@features/floor-plan/lib/floor-plan-copy";

interface PlanZoomControlsProps {
  zoomPercent: number;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onFit: () => void;
}

// Celdas de la barra: variante `button--segment` de components.css.
const CONTROL_CLASS = "button--segment";

/** Controles de zoom del croquis (`.zctl`): alejar, nivel, acercar y ajustar. */
export function PlanZoomControls({ zoomPercent, onZoomOut, onZoomIn, onFit }: Readonly<PlanZoomControlsProps>) {
  return (
    <Toolbar aria-label={FLOOR_PLAN_COPY.zoom.toolbarLabel} className="flex items-stretch gap-0 border border-border bg-background p-0">
      <Button variant="tertiary" isIconOnly aria-label={FLOOR_PLAN_COPY.zoom.zoomOut} className={CONTROL_CLASS} onPress={onZoomOut}>
        −
      </Button>
      <span
        aria-live="polite"
        className="type-tiny grid min-w-[58px] place-items-center border-l border-border text-accent tabular-nums"
      >
        {zoomPercent}%
      </span>
      <Button variant="tertiary" isIconOnly aria-label={FLOOR_PLAN_COPY.zoom.zoomIn} className={CONTROL_CLASS} onPress={onZoomIn}>
        +
      </Button>
      <Button
        variant="tertiary"
        isIconOnly
        aria-label={FLOOR_PLAN_COPY.zoom.fit}
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
