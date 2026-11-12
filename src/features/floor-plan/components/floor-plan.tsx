"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { MapDetail } from "@features/floor-plan/components/map-detail";
import { MapFilters, type FilterCounts } from "@features/floor-plan/components/map-filters";
import { MapLegend } from "@features/floor-plan/components/map-legend";
import { MapList } from "@features/floor-plan/components/map-list";
import { MapViewport, type FocusSignal } from "@features/floor-plan/components/map-viewport";
import { FLOOR_PLAN_COPY } from "@features/floor-plan/lib/floor-plan-copy";
import { FLOOR_PLAN_SECTION_ID, getItemIdFromHash } from "@features/floor-plan/lib/floor-plan-links";
import { STAND_MARKERS, ZONE_MARKERS } from "@features/floor-plan/lib/map-layout";
import {
  buildMapItems,
  countActivities,
  countBlocks,
  filterMapItems,
  type MapFilter,
  type MapItem,
} from "@features/floor-plan/lib/plan-items";
import type { MapVariant } from "@features/floor-plan/lib/map-viewport";
import type { FloorPlanStand } from "@features/floor-plan/lib/types";

export interface FloorPlanProps {
  stands: readonly FloorPlanStand[];
  variant?: MapVariant;
  pageHref?: string;
}

/** The event map: markers, filters, detail, list and legend over the pannable drawing. */
export function FloorPlan({ stands, variant = "embedded", pageHref }: Readonly<FloorPlanProps>): ReactElement {
  const items = useMemo(() => buildMapItems(stands), [stands]);
  const [filter, setFilter] = useState<MapFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const visibleItems = useMemo(() => filterMapItems(items, filter), [items, filter]);
  const selectedItem = visibleItems.find((item) => item.id === selectedId) ?? null;
  const { focusSignal, selectItem } = useFocusSignal(items, filter, setSelectedId);

  const selectFilter = (next: MapFilter): void => {
    setFilter(next);

    if (selectedId && !filterMapItems(items, next).some((item) => item.id === selectedId)) setSelectedId(null);
  };

  const content = (
    <>
      <MapHeader variant={variant} filter={filter} onSelectFilter={selectFilter} />
      <MapArea
        items={visibleItems}
        selectedId={selectedId}
        selectedItem={selectedItem}
        variant={variant}
        focusSignal={focusSignal}
        pageHref={pageHref}
        onSelect={selectItem}
        onCloseDetail={() => setSelectedId(null)}
      />
      <ListArea listOpen={listOpen} items={visibleItems} onToggle={setListOpen} onSelect={selectItem} />
      <MapLegend />
    </>
  );

  if (variant === "page") return <section id={FLOOR_PLAN_SECTION_ID}>{content}</section>;

  return (
    <section id={FLOOR_PLAN_SECTION_ID} className="section-block">
      <div className="page-wrap">{content}</div>
    </section>
  );
}

interface MapHeaderProps {
  variant: MapVariant;
  filter: MapFilter;
  onSelectFilter: (filter: MapFilter) => void;
}

function MapHeader({ variant, filter, onSelectFilter }: Readonly<MapHeaderProps>): ReactElement {
  const counts = filterCounts();
  const filters = <MapFilters active={filter} counts={counts} onChange={onSelectFilter} />;

  if (variant === "page") {
    return (
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 min-[1000px]:flex-nowrap min-[1000px]:justify-between">
        {filters}
        <p className="type-tiny whitespace-nowrap text-muted">
          {FLOOR_PLAN_COPY.page.summary(STAND_MARKERS.length, countBlocks(), counts.activities)}
        </p>
      </div>
    );
  }

  return (
    <>
      <h2 className="type-giant">{FLOOR_PLAN_COPY.heading}</h2>
      <div className="mt-[clamp(36px,5vw,64px)]">{filters}</div>
    </>
  );
}

interface MapAreaProps {
  items: readonly MapItem[];
  selectedId: string | null;
  selectedItem: MapItem | null;
  variant: MapVariant;
  focusSignal: FocusSignal | null;
  pageHref: string | undefined;
  onSelect: (id: string) => void;
  onCloseDetail: () => void;
}

function MapArea({
  items,
  selectedId,
  selectedItem,
  variant,
  focusSignal,
  pageHref,
  onSelect,
  onCloseDetail,
}: Readonly<MapAreaProps>): ReactElement {
  const detailRef = useRef<HTMLElement | null>(null);

  return (
    <>
      <div className="relative mt-6">
        <MapViewport
          items={items}
          selectedId={selectedId}
          variant={variant}
          focusSignal={focusSignal}
          detailRef={detailRef}
          onSelect={onSelect}
        />
        {selectedItem ? (
          <MapDetail item={selectedItem} variant={variant} detailRef={detailRef} onClose={onCloseDetail} />
        ) : null}
      </div>
      {pageHref ? (
        <Link
          href={pageHref}
          className="touch-target relative mt-4 inline-flex min-h-11 items-center font-mono text-xs text-accent uppercase"
        >
          {FLOOR_PLAN_COPY.sectionLink}
        </Link>
      ) : null}
    </>
  );
}

interface ListAreaProps {
  listOpen: boolean;
  items: readonly MapItem[];
  onToggle: (open: boolean) => void;
  onSelect: (id: string) => void;
}

function ListArea({ listOpen, items, onToggle, onSelect }: Readonly<ListAreaProps>): ReactElement {
  return (
    <>
      <div className="mt-6">
        <button
          type="button"
          aria-pressed={listOpen}
          onClick={() => onToggle(!listOpen)}
          className="min-h-11 border border-border px-4 font-mono text-xs text-foreground uppercase"
        >
          {listOpen ? FLOOR_PLAN_COPY.list.hide : FLOOR_PLAN_COPY.list.show}
        </button>
      </div>
      {listOpen ? (
        <div className="mt-4">
          <MapList items={items} onSelect={onSelect} />
        </div>
      ) : null}
    </>
  );
}

function filterCounts(): FilterCounts {
  const activities = countActivities();

  return { stands: STAND_MARKERS.length, activities, services: ZONE_MARKERS.length - activities };
}

interface FocusSignalState {
  focusSignal: FocusSignal | null;
  selectItem: (id: string) => void;
}

function useFocusSignal(
  items: readonly MapItem[],
  filter: MapFilter,
  setSelectedId: (id: string | null) => void,
): FocusSignalState {
  const [focusSignal, setFocusSignal] = useState<FocusSignal | null>(null);

  useEffect(() => {
    const pickFromHash = () => {
      const item = items.find((candidate) => candidate.id === getItemIdFromHash(window.location.hash));

      if (item && filterMapItems(items, filter).some((candidate) => candidate.id === item.id)) {
        setSelectedId(item.id);
        setFocusSignal({ id: item.id, point: { x: item.x, y: item.y }, always: true });
      }
    };

    pickFromHash();
    window.addEventListener("hashchange", pickFromHash);

    return () => window.removeEventListener("hashchange", pickFromHash);
  }, [items, filter, setSelectedId]);

  const selectItem = (id: string): void => {
    const item = items.find((candidate) => candidate.id === id);

    setSelectedId(id);

    if (item) setFocusSignal({ id, point: { x: item.x, y: item.y }, always: false });
  };

  return { focusSignal, selectItem };
}
