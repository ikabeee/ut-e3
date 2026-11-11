import type { MapOptions, TileLayerOptions } from "leaflet";
import type { EventVenue } from "@features/landing/lib/types";

/**
 * The tiles of the venue map and their credit: the only place that names them. They are the raster tiles of the
 * Mapbox Dark style, requested by the visitor's browser from api.mapbox.com; Leaflet fills `{accessToken}` from the
 * layer options and `{r}` with "@2x" on retina screens. Mapbox requires its logo and the three links of `attribution`
 * on every map, also with Leaflet (https://docs.mapbox.com/help/getting-started/attribution/).
 */
export const VENUE_MAP_TILES = {
  url: "https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}{r}?access_token={accessToken}",
  // Mapbox styles serve 512 px tiles: the offset keeps the zoom levels of the usual 256 px grid.
  tileSize: 512,
  zoomOffset: -1,
  minZoom: 12,
  maxZoom: 20,
  attribution: [
    externalLink("https://www.mapbox.com/about/maps/", "&copy; Mapbox"),
    externalLink("https://www.openstreetmap.org/copyright", "&copy; OpenStreetMap"),
    externalLink("https://apps.mapbox.com/feedback/", "Improve this map"),
  ].join(" "),
  logo: { href: "https://www.mapbox.com/", label: "Mapbox" },
} as const;

// Only a public token (pk.) may reach the browser; a secret one (sk.) in the bundle would leak the account.
const PUBLIC_TOKEN_PREFIX = "pk.";

/**
 * The Mapbox token the map uses, set at build time with NEXT_PUBLIC_MAPBOX_TOKEN. Without a public token the map is
 * never requested and the schematic of the venue stays.
 */
export const MAPBOX_ACCESS_TOKEN = parseMapboxToken(process.env.NEXT_PUBLIC_MAPBOX_TOKEN);

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

/** The options of the tile layer; `accessToken` fills the placeholder of the URL. */
export function buildTileLayerOptions(accessToken: string): TileLayerOptions & { accessToken: string } {
  return {
    tileSize: VENUE_MAP_TILES.tileSize,
    zoomOffset: VENUE_MAP_TILES.zoomOffset,
    minZoom: VENUE_MAP_TILES.minZoom,
    maxZoom: VENUE_MAP_TILES.maxZoom,
    attribution: VENUE_MAP_TILES.attribution,
    accessToken,
  };
}

/** The trimmed token when it is a public one; an empty string (no map) otherwise. */
export function parseMapboxToken(value: string | undefined): string {
  const token = value?.trim() ?? "";

  return token.startsWith(PUBLIC_TOKEN_PREFIX) ? token : "";
}

function externalLink(href: string, text: string): string {
  return `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
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
