"use client";

import type { ReactElement, ReactNode } from "react";
import { FLOOR_PLAN_COPY } from "@features/floor-plan/lib/floor-plan-copy";

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRecenter: () => void;
}

/** Zoom in, zoom out and recenter: 44 px buttons in one bordered group over the map. */
export function MapControls({ onZoomIn, onZoomOut, onRecenter }: Readonly<MapControlsProps>): ReactElement {
  const controls = FLOOR_PLAN_COPY.controls;

  return (
    <div role="group" aria-label={controls.groupLabel} className="flex flex-col border border-border bg-surface">
      <ControlButton label={controls.zoomIn} onPress={onZoomIn} divided>
        <path d="M12 5v14M5 12h14" />
      </ControlButton>
      <ControlButton label={controls.zoomOut} onPress={onZoomOut} divided>
        <path d="M5 12h14" />
      </ControlButton>
      <ControlButton label={controls.recenter} onPress={onRecenter} divided={false}>
        <circle cx="12" cy="12" r="7" />
        <circle cx="12" cy="12" r="1.5" />
        <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
      </ControlButton>
    </div>
  );
}

interface ControlButtonProps {
  label: string;
  onPress: () => void;
  divided: boolean;
  children: ReactNode;
}

function ControlButton({ label, onPress, divided, children }: Readonly<ControlButtonProps>): ReactElement {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onPress}
      className={`touch-target relative flex size-11 items-center justify-center text-foreground ${divided ? "border-b border-border" : ""}`}
    >
      <svg
        width={18}
        height={18}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        {children}
      </svg>
    </button>
  );
}
