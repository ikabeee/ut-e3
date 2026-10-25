import { useSyncExternalStore } from "react";
import { usePrefersReducedMotion } from "@shared/hooks/use-prefers-reduced-motion";

const REEL_AUTOPLAY_MIN_WIDTH = 1024;

const WIDE_SCREEN_QUERY = `(min-width: ${REEL_AUTOPLAY_MIN_WIDTH}px)`;

interface NetworkConnection extends EventTarget {
  saveData?: boolean;
}

export function useReelAutoplay() {
  const isWideScreen = useSyncExternalStore(subscribeToWideScreen, getWideScreenSnapshot, getServerSnapshot);
  const prefersSaveData = useSyncExternalStore(subscribeToSaveData, getSaveDataSnapshot, getServerSnapshot);
  const prefersReducedMotion = usePrefersReducedMotion();

  return isWideScreen && !prefersSaveData && !prefersReducedMotion;
}

function subscribeToWideScreen(onChange: () => void) {
  const mediaQuery = window.matchMedia(WIDE_SCREEN_QUERY);
  mediaQuery.addEventListener("change", onChange);

  return () => mediaQuery.removeEventListener("change", onChange);
}

function getWideScreenSnapshot() {
  return window.matchMedia(WIDE_SCREEN_QUERY).matches;
}

function subscribeToSaveData(onChange: () => void) {
  const connection = getConnection();
  connection?.addEventListener?.("change", onChange);

  return () => connection?.removeEventListener?.("change", onChange);
}

function getSaveDataSnapshot() {
  return getConnection()?.saveData === true;
}

function getServerSnapshot() {
  return false;
}

function getConnection() {
  // SAFETY: the Network Information API is not part of the standard TypeScript Navigator type.
  return (navigator as Navigator & { connection?: NetworkConnection }).connection;
}
