import { useEffect, useRef, useState, type RefObject } from "react";
import type { EventVenue } from "@features/landing/lib/types";
import { shouldShowFallback } from "@features/landing/lib/venue-map";
import {
  startVenueMap,
  type TileCounts,
  type VenueMapLabels,
  type VenueMapSession,
} from "@features/landing/lib/venue-map-session";
import { useOnlineStatus } from "@shared/hooks/use-online-status";

interface UseVenueMapInput {
  venue: EventVenue;
  labels: VenueMapLabels;
  /** Becomes true when the section is about to be seen: until then no script or tile is requested. */
  isEnabled: boolean;
}

const NO_TILES: TileCounts = { loaded: 0, failed: 0 };

/** Draws the venue map in the returned container and says whether it is ready to replace the schematic. */
export function useVenueMap({
  venue,
  labels,
  isEnabled,
}: UseVenueMapInput): [RefObject<HTMLDivElement | null>, { isReady: boolean }] {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [tiles, setTiles] = useState<TileCounts>(NO_TILES);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    const container = containerRef.current;

    if (!isEnabled || !container) {
      return;
    }

    let isCancelled = false;
    let session: VenueMapSession | undefined;

    startVenueMap({ container, venue, labels, onTiles: setTiles })
      .then((started) => {
        if (isCancelled) {
          started.destroy();
        } else {
          session = started;
          setIsStarted(true);
        }
      })
      .catch(() => undefined);

    return () => {
      isCancelled = true;
      session?.destroy();
      setIsStarted(false);
    };
  }, [isEnabled, venue, labels]);

  const isFallback = shouldShowFallback({ isOnline, loadedTiles: tiles.loaded, failedTiles: tiles.failed });

  return [containerRef, { isReady: isStarted && !isFallback }];
}
