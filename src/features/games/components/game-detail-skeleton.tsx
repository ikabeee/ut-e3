import { Skeleton } from "@heroui/react";

/** Silueta del detalle del juego mientras se leen los parámetros y los datos. */
export function GameDetailSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col">
      <Skeleton className="mb-[18px] h-4 w-36 rounded-none" />
      <header className="flex flex-col gap-[10px]">
        <Skeleton className="h-[clamp(28px,4.4vw,60px)] w-[min(480px,80%)] rounded-none" />
        <Skeleton className="h-4 w-48 rounded-none" />
      </header>
      <div className="my-6 flex gap-6 border-b border-border py-3">
        <Skeleton className="h-4 w-20 rounded-none" />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_320px] items-start gap-[clamp(24px,4vw,56px)] max-[980px]:grid-cols-1">
        <div className="flex min-w-0 flex-col gap-7">
          <Skeleton className="aspect-video w-full rounded-none" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-full rounded-none" />
            <Skeleton className="h-5 w-4/5 rounded-none" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-none" />
            <Skeleton className="h-6 w-24 rounded-none" />
          </div>
          <div className="flex flex-col gap-3">
            <Skeleton className="h-4 w-full rounded-none" />
            <Skeleton className="h-4 w-full rounded-none" />
            <Skeleton className="h-4 w-3/4 rounded-none" />
          </div>
        </div>

        <aside className="flex flex-col gap-3 max-[980px]:-order-1">
          <Skeleton className="aspect-[3/4] w-full rounded-none max-[980px]:hidden" />
          <Skeleton className="h-6 w-20 rounded-none" />
          <Skeleton className="h-7 w-40 rounded-none" />
          <Skeleton className="h-11 w-full rounded-none" />
          <Skeleton className="h-11 w-full rounded-none" />
        </aside>
      </div>
    </div>
  );
}
