import { useSyncExternalStore } from "react";
import { usePrefersReducedMotion } from "@shared/hooks/use-prefers-reduced-motion";

interface NetworkConnection extends EventTarget {
  saveData?: boolean;
}

export function useLoopAutoplay() {
  const prefersSaveData = useSyncExternalStore(subscribeToSaveData, getSaveDataSnapshot, getServerSnapshot);
  const prefersReducedMotion = usePrefersReducedMotion();

  return !prefersSaveData && !prefersReducedMotion;
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
