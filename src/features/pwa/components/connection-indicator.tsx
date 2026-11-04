"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useOnlineStatus } from "@shared/hooks/use-online-status";
import { PWA_COPY } from "@features/pwa/lib/pwa-copy";
import { resolveReconnectTarget } from "@features/pwa/lib/reconnect-target";

interface ConnectionIndicatorProps {
  /**
   * Where to go when the network returns. Without it the page refreshes its data; with it the page is replaced (the
   * offline page goes back to what the visitor wanted, or to this path).
   */
  reconnectTo?: string;
}

const COPY = PWA_COPY.connection;

/** Says whether the phone has a network and, when it comes back, retries by itself. */
export function ConnectionIndicator({ reconnectTo }: Readonly<ConnectionIndicatorProps>) {
  const isOnline = useOnlineStatus();
  const router = useRouter();
  const wasOnline = useRef(isOnline);

  useEffect(() => {
    const justReconnected = isOnline && !wasOnline.current;

    wasOnline.current = isOnline;

    if (!justReconnected) return;

    if (reconnectTo) {
      window.location.replace(resolveReconnectTarget({ search: window.location.search, fallback: reconnectTo }));
    } else {
      router.refresh();
    }
  }, [isOnline, reconnectTo, router]);

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
