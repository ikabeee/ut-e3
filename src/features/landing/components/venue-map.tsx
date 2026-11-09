"use client";

import "leaflet/dist/leaflet.css";
import "@features/landing/components/venue-map.css";
import { useMemo, type ReactNode } from "react";
import { cn } from "@heroui/react";
import { useVenueMap } from "@features/landing/hooks/use-venue-map";
import { useVisibleOnce } from "@features/landing/hooks/use-visible-once";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";
import type { EventVenue } from "@features/landing/lib/types";
import { MAPBOX_ACCESS_TOKEN } from "@features/landing/lib/venue-map";
import { siteConfig } from "@shared/lib/site-config";

interface VenueMapProps {
  venue: EventVenue;
  /** The schematic: it is what shows before the map loads, and without a connection. */
  fallback: ReactNode;
}

/**
 * The venue map of Leaflet over the schematic. The map is requested only when the section is about to be seen, and
 * never without a Mapbox token: then the schematic stays.
 */
export function VenueMap({ venue, fallback }: Readonly<VenueMapProps>) {
  const { map } = LANDING_COPY.venue;
  const [sectionRef, isVisible] = useVisibleOnce<HTMLDivElement>();

  const labels = useMemo(
    () => ({ zoomIn: map.zoomIn, zoomOut: map.zoomOut, pinName: siteConfig.name, pinPlace: venue.shortName }),
    [map.zoomIn, map.zoomOut, venue.shortName],
  );

  const [mapRef, { isReady }] = useVenueMap({
    venue,
    labels,
    accessToken: MAPBOX_ACCESS_TOKEN,
    isEnabled: isVisible && MAPBOX_ACCESS_TOKEN !== "",
  });

  return (
    <div ref={sectionRef} className="relative h-full min-h-80">
      <div aria-hidden={isReady}>{fallback}</div>
      <div
        role="region"
        aria-label={map.regionLabel(venue.building, venue.shortName)}
        aria-hidden={!isReady}
        className={cn("absolute inset-0", !isReady && "invisible")}
      >
        {/* Leaflet adds its own classes to this element: its className must never change. */}
        <div ref={mapRef} className="venue-map size-full" />
      </div>
    </div>
  );
}
