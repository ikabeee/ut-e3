export type ItchLink = { status: "hidden" } | { status: "pending"; opensAt: string } | { status: "open"; url: string };

interface ItchLinkInput {
  itchUrl: string | null;
  itchOpensAt: string;
  now: Date;
}

// RF-10: the link appears from the configured time on, judged by the server clock the caller passes as `now`.
export function resolveItchLink({ itchUrl, itchOpensAt, now }: ItchLinkInput): ItchLink {
  if (!itchUrl) return { status: "hidden" };

  if (now.getTime() < new Date(itchOpensAt).getTime()) return { status: "pending", opensAt: itchOpensAt };

  return { status: "open", url: itchUrl };
}
