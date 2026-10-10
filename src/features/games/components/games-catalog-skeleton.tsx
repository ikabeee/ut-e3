import { Skeleton } from "@heroui/react";

const GENRE_PLACEHOLDERS = ["first", "second", "third", "fourth"] as const;
const CARD_PLACEHOLDERS = ["a", "b", "c", "d", "e"] as const;

/** Silueta del catálogo mientras llegan los datos (mantiene el layout y evita saltos). */
export function GamesCatalogSkeleton() {
  return (
    <div aria-hidden="true">
      <Skeleton className="mb-[22px] h-[clamp(24px,3.4vw,46px)] w-[min(320px,60%)] rounded-none" />
      <div className="grid grid-cols-4 gap-4 max-[1000px]:grid-cols-3 max-[760px]:grid-cols-1">
        {GENRE_PLACEHOLDERS.map((id) => (
          <Skeleton key={id} className="aspect-[16/12] rounded-none" />
        ))}
      </div>
      <Skeleton className="mt-[clamp(40px,6vw,72px)] mb-5 h-[46px] max-w-[520px] rounded-none" />
      <div className="grid grid-cols-5 gap-x-4 gap-y-[22px] max-[1200px]:grid-cols-4 max-[1000px]:grid-cols-3 max-[760px]:grid-cols-2">
        {CARD_PLACEHOLDERS.map((id) => (
          <Skeleton key={id} className="aspect-[3/4] rounded-none" />
        ))}
      </div>
    </div>
  );
}
