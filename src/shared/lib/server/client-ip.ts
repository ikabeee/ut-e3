import "server-only";
import { headers } from "next/headers";

const UNKNOWN_CLIENT = "unknown";

export async function resolveClientIp(): Promise<string> {
  return readClientIp(await headers());
}

/**
 * Address of the client as seen by our own proxy. Caddy and Nginx (docs/deploy.md) append the address they saw to
 * X-Forwarded-For, and `next start` adds the socket address when the header is missing, so only the last hop is
 * trustworthy: every value before it was sent by the client and can be made up.
 */
export function readClientIp(requestHeaders: Headers): string {
  const hops = (requestHeaders.get("x-forwarded-for") ?? "")
    .split(",")
    .map((hop) => hop.trim())
    .filter(Boolean);

  return hops.at(-1) ?? UNKNOWN_CLIENT;
}
