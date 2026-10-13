"use client";

import { cn } from "@heroui/react";
import { useStandTraffic } from "@features/visitors/hooks/use-stand-traffic";
import { getTrafficLevel, type TrafficLevel } from "@features/visitors/lib/stand-traffic";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";

const LEVEL_DOT_CLASS: Record<TrafficLevel, string> = {
  low: "bg-success",
  medium: "bg-warning",
  high: "bg-danger",
};

interface StandTrafficBadgeProps {
  standCode: string;
}

/** Afluencia en vivo de un stand (se refresca cada 30 segundos). No muestra nada mientras carga. */
export function StandTrafficBadge({ standCode }: Readonly<StandTrafficBadgeProps>) {
  const traffic = useStandTraffic(standCode);

  if (!traffic) return null;

  const level = getTrafficLevel(traffic.recentCheckIns);

  return (
    <p className="m-0 flex items-center gap-2 type-tiny">
      <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", LEVEL_DOT_CLASS[level])} />
      <span>{VISITORS_COPY.traffic.summary(level, traffic.recentCheckIns, traffic.windowMinutes)}</span>
    </p>
  );
}
