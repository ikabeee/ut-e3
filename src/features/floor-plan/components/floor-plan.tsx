"use client";

import { useEffect, useMemo, useRef, useState, type ReactElement, type RefObject } from "react";
import { MapDetail } from "@features/floor-plan/components/map-detail";
import { MapFilters, type FilterCounts } from "@features/floor-plan/components/map-filters";
import { MapLegend } from "@features/floor-plan/components/map-legend";
import { MapList } from "@features/floor-plan/components/map-list";
import { MapListToggle } from "@features/floor-plan/components/map-list-toggle";
import { MapViewport, type FocusSignal } from "@features/floor-plan/components/map-viewport";
import { FLOOR_PLAN_COPY } from "@features/floor-plan/lib/floor-plan-copy";
import { FLOOR_PLAN_SECTION_ID, getItemIdFromHash } from "@features/floor-plan/lib/floor-plan-links";
import { STAND_MARKERS, ZONE_MARKERS } from "@features/floor-plan/lib/map-layout";
import {
  buildMapItems,
  countActivities,
  filterMapItems,
  type MapFilter,
  type MapItem,
} from "@features/floor-plan/lib/plan-items";
import type { MapVariant } from "@features/floor-plan/lib/map-viewport";
import type { FloorPlanStand } from "@features/floor-plan/lib/types";

export interface FloorPlanProps {
  stands: readonly FloorPlanStand[];
  variant?: MapVariant;
  /**
   * The landing corrections of the embedded map: the kicker of a stand has no code and the list, once opened, stays.
   * The page variant has them always.
   */
  isLanding?: boolean;
}

/** The event map: markers, filters, detail, list and legend over the pannable drawing. */
export function FloorPlan({ stands, variant = "embedded", isLanding = false }: Readonly<FloorPlanProps>): ReactElement {
  const items = useMapItems(stands, isLanding || variant === "page");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { filter, selectFilter } = useFilterSelection(items, selectedId, setSelectedId);
  const [listOpen, setListOpen] = useState(false);
  const visibleItems = useMemo(() => filterMapItems(items, filter), [items, filter]);
  const selectedItem = visibleItems.find((item) => item.id === selectedId) ?? null;
  const { focusSignal, selectItem, showItem } = useFocusSignal(items, filter, setSelectedId);
  const { mapAreaRef, showItemOnMap } = useShowOnMap(showItem);

  const content = (
    <>
      <MapHeader variant={variant} filter={filter} onSelectFilter={selectFilter} />
      <MapArea
        items={visibleItems}
        selectedId={selectedId}
        selectedItem={selectedItem}
        variant={variant}
        focusSignal={focusSignal}
        areaRef={mapAreaRef}
        onSelect={selectItem}
        onCloseDetail={() => setSelectedId(null)}
      />
      <ListArea
        canHide={!isLanding || variant === "page"}
        listOpen={listOpen}
        items={visibleItems}
        selectedId={selectedId}
        onToggle={setListOpen}
        onSelect={showItemOnMap}
      />
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
  areaRef: RefObject<HTMLDivElement | null>;
  onSelect: (id: string) => void;
  onCloseDetail: () => void;
}

function MapArea({
  items,
  selectedId,
  selectedItem,
  variant,
  focusSignal,
  areaRef,
  onSelect,
  onCloseDetail,
}: Readonly<MapAreaProps>): ReactElement {
  const detailRef = useRef<HTMLElement | null>(null);

  return (
    <div ref={areaRef} className="relative mt-6 scroll-mt-24">
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
  );
}

interface ListAreaProps {
  canHide: boolean;
  listOpen: boolean;
  items: readonly MapItem[];
  selectedId: string | null;
  onToggle: (open: boolean) => void;
  onSelect: (id: string) => void;
}

function ListArea({ canHide, listOpen, items, selectedId, onToggle, onSelect }: Readonly<ListAreaProps>): ReactElement {
  // On the landing the list stays once opened; everywhere else the button also hides it again.
  const canToggle = canHide || !listOpen;

  return (
    <>
      {canToggle ? (
        <div className="mt-6">
          <MapListToggle listOpen={listOpen} onToggle={onToggle} />
        </div>
      ) : null}
      {listOpen ? (
        <div className="mt-4">
          <MapList items={items} selectedId={selectedId} onSelect={onSelect} />
        </div>
      ) : null}
    </>
  );
}

function filterCounts(): FilterCounts {
  const activities = countActivities();

  return { stands: STAND_MARKERS.length, activities, services: ZONE_MARKERS.length - activities };
}

/** The markers of the map; the kicker of a stand carries its code unless the landing corrections apply. */
function useMapItems(stands: readonly FloorPlanStand[], hasLandingFixes: boolean): MapItem[] {
  return useMemo(() => buildMapItems(stands, { hasStandCodeKicker: !hasLandingFixes }), [stands, hasLandingFixes]);
}

interface FilterSelection {
  filter: MapFilter;
  selectFilter: (next: MapFilter) => void;
}

/** The active filter chip; choosing one that hides the selected item clears the selection. */
function useFilterSelection(
  items: readonly MapItem[],
  selectedId: string | null,
  setSelectedId: (id: string | null) => void,
): FilterSelection {
  const [filter, setFilter] = useState<MapFilter>("all");

  const selectFilter = (next: MapFilter): void => {
    setFilter(next);

    if (selectedId && !filterMapItems(items, next).some((item) => item.id === selectedId)) setSelectedId(null);
  };

  return { filter, selectFilter };
}

interface ShowOnMap {
  mapAreaRef: RefObject<HTMLDivElement | null>;
  showItemOnMap: (id: string) => void;
}

/** Selecting from the list happens below the map: also bring the map into view, as a tap on it would have. */
function useShowOnMap(showItem: (id: string) => void): ShowOnMap {
  const mapAreaRef = useRef<HTMLDivElement | null>(null);

  const showItemOnMap = (id: string): void => {
    showItem(id);
    mapAreaRef.current?.scrollIntoView?.({ block: "nearest" });
  };

  return { mapAreaRef, showItemOnMap };
}

interface FocusSignalState {
  focusSignal: FocusSignal | null;
  selectItem: (id: string) => void;
  showItem: (id: string) => void;
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

  const focusItem = (id: string, always: boolean): void => {
    const item = items.find((candidate) => candidate.id === id);

    setSelectedId(id);

    if (item) setFocusSignal({ id, point: { x: item.x, y: item.y }, always });
  };

  // A marker tap only moves a compact map; a list entry always centers the map on its item.
  return {
    focusSignal,
    selectItem: (id) => focusItem(id, false),
    showItem: (id) => focusItem(id, true),
  };
}
