"use client";

import { useSyncExternalStore } from "react";

export interface Fullscreen {
  isFullscreen: boolean;
  /** Fullscreen needs a press of the person: the browser refuses it from a timer or on load. */
  enter: () => void;
}

/** The stage screen asks for fullscreen with a button, and the button hides while it is on (RF-49). */
export function useFullscreen(): Fullscreen {
  const isFullscreen = useSyncExternalStore(subscribe, readIsFullscreen, readServerValue);

  return { isFullscreen, enter };
}

function subscribe(onChange: () => void): () => void {
  document.addEventListener("fullscreenchange", onChange);

  return () => document.removeEventListener("fullscreenchange", onChange);
}

function readIsFullscreen(): boolean {
  return Boolean(document.fullscreenElement);
}

function readServerValue(): boolean {
  return false;
}

// A browser without the API (or that refuses it) keeps the page as it is; F11 still works.
function enter(): void {
  document.documentElement.requestFullscreen?.().catch(() => undefined);
}
