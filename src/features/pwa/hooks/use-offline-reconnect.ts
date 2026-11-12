import { useCallback, useEffect, useRef, useState } from "react";
import { canReachTarget } from "@features/pwa/lib/reconnect-probe";
import { resolveReconnectTarget } from "@features/pwa/lib/reconnect-target";
import { useOnlineStatus } from "@shared/hooks/use-online-status";

export const RETRY_INTERVAL_MS = 5000;

/** "offline": no network. "checking": network, asking the server. "unreachable": network, but the server did not answer. */
export type ReconnectState = "offline" | "checking" | "unreachable";

/** Where the page goes once the destination answers; a parameter so a test does not have to navigate jsdom. */
export type Navigate = (target: string) => void;

interface OfflineReconnect {
  state: ReconnectState;
  isRetrying: boolean;
  retry: () => void;
}

/**
 * Takes the visitor off /offline as soon as the destination answers. It checks when the page opens with a network, every
 * few seconds while it stays open, when the tab becomes visible again, when the browser says the network returned and
 * when the visitor taps "Reintentar" (see `canReachTarget` for why the "online" event alone is not enough).
 */
export function useOfflineReconnect(fallback: string, navigate: Navigate = replaceLocation): OfflineReconnect {
  const isOnline = useOnlineStatus();
  const [hasFailed, setHasFailed] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const isProbing = useRef(false);

  // Resolves false only when the server did not answer; a skipped check or a successful one resolves true.
  const check = useCallback(async (): Promise<boolean> => {
    if (isProbing.current || !navigator.onLine) return true;

    isProbing.current = true;

    const target = resolveReconnectTarget({ search: window.location.search, fallback });

    if (await canReachTarget(target)) {
      navigate(target);

      return true;
    }

    isProbing.current = false;

    return false;
  }, [fallback, navigate]);

  const probe = useCallback(
    () =>
      check().then((answered) => {
        if (!answered) setHasFailed(true);
      }),
    [check],
  );

  useChecksWhileOnline({ isOnline, probe });

  const retry = useCallback(() => {
    setIsRetrying(true);
    void probe().finally(() => setIsRetrying(false));
  }, [probe]);

  return { state: toState(isOnline, hasFailed), isRetrying, retry };
}

function replaceLocation(target: string): void {
  window.location.replace(target);
}

function toState(isOnline: boolean, hasFailed: boolean): ReconnectState {
  if (!isOnline) return "offline";

  return hasFailed ? "unreachable" : "checking";
}

// While there is a network: now, every few seconds and each time the tab becomes visible again.
function useChecksWhileOnline({ isOnline, probe }: { isOnline: boolean; probe: () => Promise<void> }): void {
  useEffect(() => {
    if (!isOnline) return;

    const probeNow = () => void probe();

    const onVisible = () => {
      if (document.visibilityState === "visible") probeNow();
    };

    const timer = setInterval(probeNow, RETRY_INTERVAL_MS);

    probeNow();

    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [isOnline, probe]);
}
