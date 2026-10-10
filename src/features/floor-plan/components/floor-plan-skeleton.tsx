import { Skeleton } from "@heroui/react";

/** Silueta del croquis mientras llegan los datos (mantiene el layout y evita saltos). */
export function FloorPlanSkeleton() {
  return (
    <div aria-hidden="true">
      <Skeleton className="mb-5 h-[clamp(30px,7vw,104px)] w-[min(520px,70%)] rounded-none" />
      <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-gutter max-[900px]:grid-cols-1">
        <Skeleton className="aspect-[1000/598] rounded-none max-[560px]:aspect-[400/900]" />
        <Skeleton className="h-[420px] rounded-none" />
      </div>
    </div>
  );
}
