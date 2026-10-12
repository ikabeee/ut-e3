import { Skeleton } from "@heroui/react";

/** Silueta del pasaporte mientras se lee la cookie y la base. */
export function PassportSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="grid grid-cols-[minmax(260px,360px)_minmax(0,1fr)] gap-[clamp(24px,4vw,56px)] max-[860px]:grid-cols-1"
    >
      <Skeleton className="aspect-[3/4] rounded-none" />
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 rounded-none" />
        <Skeleton className="h-32 rounded-none" />
        <Skeleton className="h-64 rounded-none" />
      </div>
    </div>
  );
}
