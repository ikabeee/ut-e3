"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, type ReactElement, type RefObject } from "react";
import { ArrowGlyph } from "@shared/components/arrow-glyph";
import { GenericCover } from "@shared/components/generic-cover";
import { FLOOR_PLAN_COPY } from "@features/floor-plan/lib/floor-plan-copy";
import { getGamePath } from "@features/games/lib/games-links";
import type { MapItem } from "@features/floor-plan/lib/plan-items";
import type { MapVariant } from "@features/floor-plan/lib/map-viewport";

interface MapDetailProps {
  item: MapItem;
  variant: MapVariant;
  detailRef: RefObject<HTMLElement | null>;
  onClose: () => void;
}

/** The selected marker: a card over the map from 1000 px wide, a bottom sheet below it. Never a modal. */
export function MapDetail({ item, variant, detailRef, onClose }: Readonly<MapDetailProps>): ReactElement {
  useEscapeToClose(onClose);

  const Title = variant === "page" ? "h2" : "h3";

  return (
    <section
      ref={detailRef}
      aria-label={FLOOR_PLAN_COPY.detailLabel}
      aria-live="polite"
      className="absolute inset-x-0 bottom-0 flex max-h-[55%] flex-col gap-4 overflow-y-auto border-t border-border bg-surface p-4 shadow-[0_24px_48px_rgba(0,0,0,0.6)] min-[1000px]:inset-x-auto min-[1000px]:top-4 min-[1000px]:right-4 min-[1000px]:bottom-auto min-[1000px]:max-h-none min-[1000px]:w-[440px] min-[1000px]:overflow-visible min-[1000px]:border min-[1000px]:p-5"
    >
      <div aria-hidden="true" className="flex justify-center min-[1000px]:hidden">
        <span className="h-1 w-10 rounded-full bg-muted" />
      </div>
      <div className="flex items-start gap-4">
        <DetailThumbnail item={item} />
        <div className="min-w-0 flex-1">
          <p className="type-tiny tracking-[0.12em] text-accent">{item.kicker}</p>
          <Title className="mt-2 type-wide text-[22px] leading-[1.1] tracking-[-0.02em] text-foreground">
            {item.title}
          </Title>
          <p className="mt-2 line-clamp-3 text-sm/6 text-map-copy">{item.description}</p>
          {detailBlockLine(item)}
        </div>
        <CloseDetailButton onClose={onClose} />
      </div>
      <DetailActions item={item} onClose={onClose} />
    </section>
  );
}

function useEscapeToClose(onClose: () => void): void {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", closeOnEscape);

    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);
}

function DetailThumbnail({ item }: Readonly<{ item: MapItem }>): ReactElement | null {
  if (item.coverSrc) {
    return (
      <Image
        src={item.coverSrc}
        alt={item.coverAlt}
        width={112}
        height={112}
        className="size-24 shrink-0 object-cover min-[1000px]:size-28"
      />
    );
  }

  if (item.gameName) {
    return (
      <div className="relative size-24 shrink-0 overflow-hidden min-[1000px]:size-28">
        <GenericCover title={item.gameName} />
      </div>
    );
  }

  return null;
}

function detailBlockLine(item: MapItem): ReactElement | null {
  if (!item.blockLabel || item.standNumber === null) return null;

  return (
    <p className="mt-2 type-tiny font-mono text-muted">
      {FLOOR_PLAN_COPY.blockLine(item.blockLabel, item.standNumber, item.blockSize)}
    </p>
  );
}

function DetailActions({ item, onClose }: Readonly<{ item: MapItem; onClose: () => void }>): ReactElement | null {
  if (!item.slug) {
    return (
      <div className="min-[1000px]:hidden">
        <button
          type="button"
          onClick={onClose}
          className="h-12 w-full border border-border px-4 font-mono text-xs text-foreground uppercase"
        >
          {FLOOR_PLAN_COPY.detail.dismiss}
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Link
        href={getGamePath(item.slug)}
        className="flex min-h-12 flex-1 items-center justify-center gap-2 bg-accent px-4 font-mono text-xs text-accent-foreground uppercase min-[1000px]:min-h-11 min-[1000px]:w-full"
      >
        {FLOOR_PLAN_COPY.detail.gameLink}
        <ArrowGlyph direction="e" />
      </Link>
      <button
        type="button"
        onClick={onClose}
        className="h-12 shrink-0 border border-border px-4 font-mono text-xs text-foreground uppercase min-[1000px]:hidden"
      >
        {FLOOR_PLAN_COPY.detail.dismiss}
      </button>
    </div>
  );
}

function CloseDetailButton({ onClose }: Readonly<{ onClose: () => void }>): ReactElement {
  return (
    <button
      type="button"
      aria-label={FLOOR_PLAN_COPY.detail.close}
      onClick={onClose}
      className="touch-target relative flex size-11 shrink-0 items-center justify-center text-muted"
    >
      <svg
        width={20}
        height={20}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path d="M6 6l12 12M18 6 6 18" />
      </svg>
    </button>
  );
}
