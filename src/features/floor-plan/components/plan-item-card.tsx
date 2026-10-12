import { cn } from "@heroui/react";
import { getItemKicker } from "@features/floor-plan/lib/plan-items";
import type { PlanItem } from "@features/floor-plan/lib/types";
import { PaperCard } from "@shared/components/paper-card";

/** Atributo `sizes` para la portada que llega en `StandOccupant.cover`: la tarjeta mide 340 px. */
export const PLAN_ITEM_COVER_SIZES = "340px";

interface PlanItemCardProps {
  item: PlanItem;
  /** `overview`: panel del inicio (`.panel`). `explorer`: tarjeta del croquis (`.pcard`). */
  variant: "overview" | "explorer";
}

/**
 * Panel con la información del stand o zona seleccionada; los stands de equipo llevan su portada
 * y, si la page lo compone, su estado en vivo.
 */
export function PlanItemCard({ item, variant }: Readonly<PlanItemCardProps>) {
  const isOverview = variant === "overview";
  const Heading = isOverview ? "h3" : "h2";

  return (
    <div className="flex min-w-0 flex-col" aria-live="polite">
      {item.cover ? (
        <div className="relative aspect-video max-w-full overflow-hidden bg-surface">{item.cover}</div>
      ) : null}
      <PaperCard className={isOverview ? "gap-[10px] px-[22px] pt-[22px] pb-7" : "gap-2 p-[18px] pb-5"}>
        <span className="type-tiny">{getItemKicker(item)}</span>
        <Heading
          className={cn(
            // El tamaño va antes que `leading-*`: tailwind-merge descarta el interlineado si viene después.
            isOverview ? "text-[26px]" : "text-2xl",
            "font-wide leading-[.95] font-bold tracking-[-.03em] uppercase",
          )}
        >
          {item.title}
        </Heading>
        <p className={cn("m-0", isOverview ? "text-base leading-[1.25]" : "text-[15px] leading-[1.3]")}>
          {item.description}
        </p>
        {item.status}
      </PaperCard>
    </div>
  );
}
