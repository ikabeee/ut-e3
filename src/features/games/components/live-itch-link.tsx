"use client";

import { useEffect, useState } from "react";
import { fetchItchLink } from "@features/games/api/games-api-client";
import { GameItchLink } from "@features/games/components/game-itch-link";
import type { ItchLink } from "@features/games/lib/itch-link";
import { useNow } from "@shared/hooks/use-now";

const REFRESH_MS = 30 * 1000;

/**
 * The itch.io link of a game (RF-10). The page is static and does not carry the URL: this asks the server, which decides
 * with its own clock, and asks again every 30 seconds while the link is not open, so it appears by itself at the
 * activation time. Without a network it keeps the last answer, and shows nothing if it never got one.
 */
export function LiveItchLink({ slug }: Readonly<{ slug: string }>) {
  const now = useNow(REFRESH_MS);
  const [link, setLink] = useState<ItchLink | null>(null);
  const isSettled = link?.status === "open" || link?.status === "hidden";

  useEffect(() => {
    if (now === 0 || isSettled) return;

    let isCurrent = true;

    void fetchItchLink(slug).then((next) => {
      if (isCurrent && next) setLink(next);
    });

    return () => {
      isCurrent = false;
    };
  }, [slug, now, isSettled]);

  return link ? <GameItchLink link={link} /> : null;
}
