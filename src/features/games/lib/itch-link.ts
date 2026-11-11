export type ItchLink = { status: "hidden" } | { status: "pending"; opensAt: string } | { status: "open"; url: string };

interface ItchLinkInput {
  itchUrl: string | null;
  itchOpensAt: string;
  now: Date;
}

// RF-10: the link appears from the configured time on, judged by the clock the caller passes as `now`: the one of the server.
export function resolveItchLink({ itchUrl, itchOpensAt, now }: ItchLinkInput): ItchLink {
  if (!itchUrl) return { status: "hidden" };

  if (now.getTime() < new Date(itchOpensAt).getTime()) return { status: "pending", opensAt: itchOpensAt };

  return { status: "open", url: itchUrl };
}

export function isItchLink(value: unknown): value is ItchLink {
  if (!isObject(value) || !("status" in value)) return false;

  if (value.status === "hidden") return true;

  if (value.status === "pending") return "opensAt" in value && typeof value.opensAt === "string";

  return value.status === "open" && "url" in value && typeof value.url === "string";
}

function isObject(value: unknown): value is object {
  return value !== null && typeof value === "object";
}
