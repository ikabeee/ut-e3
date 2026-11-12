"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useOnlineStatus } from "@shared/hooks/use-online-status";
import { PWA_COPY } from "@features/pwa/lib/pwa-copy";

const COPY = PWA_COPY.connection;

/** Says whether the phone has a network and, when it comes back, refreshes the data of the page. */
export function ConnectionIndicator() {
  const isOnline = useOnlineStatus();
  const router = useRouter();
  const wasOnline = useRef(isOnline);

  useEffect(() => {
    const justReconnected = isOnline && !wasOnline.current;

    wasOnline.current = isOnline;

    if (justReconnected) router.refresh();
  }, [isOnline, router]);

  return <ConnectionBadge isOnline={isOnline} />;
}

/** The "En línea" / "Sin conexión" label, for a page that already knows the state. */
export function ConnectionBadge({ isOnline }: Readonly<{ isOnline: boolean }>) {
  return (
    <p
      role="status"
      aria-label={COPY.label}
      className="inline-flex items-center gap-2 type-tiny text-muted"
      data-connection={isOnline ? "online" : "offline"}
    >
      <span aria-hidden="true" className={`size-2 rounded-full ${isOnline ? "bg-success" : "bg-danger"}`} />
      {isOnline ? COPY.online : COPY.offline}
    </p>
  );
}
