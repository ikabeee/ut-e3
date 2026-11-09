import { useSyncExternalStore } from "react";

/** Whether the browser thinks it has a network; the server and the first render assume it does. */
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribe, readStatus, readServerStatus);
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);

  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

function readStatus(): boolean {
  return navigator.onLine;
}

function readServerStatus(): boolean {
  return true;
}
