import { Skeleton } from "@heroui/react";

const BLOCKS = ["first", "second", "third"] as const;

/** Silueta de una sección del panel mientras llegan los datos. */
export function AdminSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-4">
      {BLOCKS.map((id) => (
        <Skeleton key={id} className="h-40 rounded-none" />
      ))}
    </div>
  );
}
