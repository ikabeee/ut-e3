import { useSyncExternalStore } from "react";

/**
 * The token of an email recovery link, which the claim route puts in the fragment (`#<token>`) so it never reaches the
 * server logs. Null while rendering on the server, an empty string when the fragment is missing.
 */
export function useRecoveryLinkToken(): string | null {
  return useSyncExternalStore(subscribe, readToken, readServerToken);
}

function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange);

  return () => window.removeEventListener("hashchange", onChange);
}

// A fragment edited by hand can be malformed ("#%E0"); that is an incomplete link, not a crash of the page.
function readToken(): string {
  try {
    return decodeURIComponent(window.location.hash.slice(1));
  } catch {
    return "";
  }
}

function readServerToken(): null {
  return null;
}
