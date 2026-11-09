import type { MapOptions, TileLayerOptions } from "leaflet";
import type { EventVenue } from "@features/landing/lib/types";

/**
 * The tiles of the venue map and their credit: the only place that names them. They are the standard OpenStreetMap
 * tiles (no API key); the visitor's browser requests them straight from tile.openstreetmap.org. CARTO Dark Matter was
 * the first choice, but it now answers every tile with an "API KEY REQUIRED" watermark. The dark look comes from a CSS
 * filter (venue-map.css), since OpenStreetMap only serves a light style.
 */
export const VENUE_MAP_TILES = {
  url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  minZoom: 12,
  maxZoom: 19,
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
} as const;

/** The size of the pin, in px; its anchor is the bottom center, where the line touches the venue. */
export const VENUE_PIN_SIZE = { width: 180, height: 84 } as const;

/** Tiles that fail before the map counts as unreachable, if none has loaded. */
export const TILE_ERROR_LIMIT = 2;

interface MapContext {
  /** A touch screen: one finger scrolls the page instead of dragging the map. */
  isTouch: boolean;
}

export function buildMapOptions(venue: EventVenue, { isTouch }: MapContext): MapOptions {
  return {
    center: [venue.coordinates.latitude, venue.coordinates.longitude],
    zoom: venue.mapZoom,
    minZoom: VENUE_MAP_TILES.minZoom,
    maxZoom: VENUE_MAP_TILES.maxZoom,
    // The wheel only zooms after a click or with ctrl, so the map never traps the scroll of the page.
    scrollWheelZoom: false,
    dragging: !isTouch,
    touchZoom: true,
    keyboard: true,
    attributionControl: true,
    // The session adds the zoom control itself, to give it the titles of the copy.
    zoomControl: false,
  };
}

export function buildTileLayerOptions(): TileLayerOptions {
  return {
    minZoom: VENUE_MAP_TILES.minZoom,
    maxZoom: VENUE_MAP_TILES.maxZoom,
    attribution: VENUE_MAP_TILES.attribution,
  };
}

interface TileStatus {
  isOnline: boolean;
  loadedTiles: number;
  failedTiles: number;
}

/** The schematic replaces the map without a connection, or when the tiles fail and none has ever loaded. */
export function shouldShowFallback({ isOnline, loadedTiles, failedTiles }: TileStatus): boolean {
  return !isOnline || (loadedTiles === 0 && failedTiles >= TILE_ERROR_LIMIT);
}
