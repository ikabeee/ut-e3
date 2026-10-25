import Image from "next/image";
import { PaperCard } from "@shared/components/paper-card";
import type { PlanItem } from "@features/floor-plan/lib/types";

interface PlanPanelProps {
  item: PlanItem;
}

const COVER_SIZES = "(min-width: 1000px) 340px, 100vw";

export function PlanPanel({ item }: Readonly<PlanPanelProps>) {
  return (
    <div className="flex min-w-0 flex-col" aria-live="polite">
      {item.cover ? (
        <div className="relative aspect-video max-w-full overflow-hidden bg-surface">
          <Image src={item.cover.src} alt={item.cover.alt} fill sizes={COVER_SIZES} className="object-cover" />
        </div>
      ) : null}
      <PaperCard className="gap-[10px] px-[22px] pt-[22px] pb-7">
        <span className="type-tiny">{item.kicker}</span>
        <h3 className="font-wide text-[26px] leading-[.95] font-bold tracking-[-.03em] uppercase">{item.title}</h3>
        <p className="m-0 text-base leading-[1.25]">{item.description}</p>
      </PaperCard>
    </div>
  );
}
