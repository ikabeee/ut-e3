import { OFFLINE_PATH } from "@features/pwa/lib/pwa-links";

export const PROBE_TIMEOUT_MS = 4000;

/**
 * Whether `target` answers right now. `navigator.onLine` only says the phone has a network, not that the server is
 * reachable, and the "online" event can be lost (browser in the background) or never fire (the page was reloaded
 * already online), so /offline asks the destination itself. A short timeout and no cache keep a dead network from
 * hanging the check, and an answer that is the offline page itself does not count.
 */
export async function canReachTarget(target: string, timeoutMs: number = PROBE_TIMEOUT_MS): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(target, { cache: "no-store", credentials: "same-origin", signal: controller.signal });

    return response.ok && !isOfflinePage(response.url);
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

function isOfflinePage(url: string): boolean {
  return url !== "" && new URL(url, window.location.href).pathname.startsWith(OFFLINE_PATH);
}
