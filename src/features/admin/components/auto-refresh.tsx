"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Reads the page again from the server every `intervalMs` while the tab is visible, so a screen that is left open keeps
 * showing the latest readings. The page stays dynamic (connection()), so nothing here touches a cached result.
 */
export function AutoRefresh({ intervalMs }: Readonly<{ intervalMs: number }>) {
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [router, intervalMs]);

  return null;
}
