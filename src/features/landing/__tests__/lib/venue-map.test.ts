import { EVENT_VENUE } from "@features/landing/lib/venue";
import {
  buildMapOptions,
  buildTileLayerOptions,
  shouldShowFallback,
  TILE_ERROR_LIMIT,
  VENUE_MAP_TILES,
} from "@features/landing/lib/venue-map";

describe("venue map tiles", () => {
  it("uses the standard OpenStreetMap tiles, which need no API key", () => {
    expect(VENUE_MAP_TILES.url).toBe("https://tile.openstreetmap.org/{z}/{x}/{y}.png");
    expect(VENUE_MAP_TILES.url).not.toMatch(/key|token/i);
  });

  it("never asks for a zoom the tiles do not have", () => {
    const { minZoom, maxZoom } = buildTileLayerOptions();

    expect(maxZoom).toBeLessThanOrEqual(19);
    expect(EVENT_VENUE.mapZoom).toBeGreaterThanOrEqual(minZoom ?? 0);
    expect(EVENT_VENUE.mapZoom).toBeLessThanOrEqual(maxZoom ?? 0);
  });

  it("credits OpenStreetMap contributors with a link that opens safely", () => {
    const { attribution } = buildTileLayerOptions();

    expect(attribution).toContain("OpenStreetMap</a> contributors");
    expect(attribution).toContain("https://www.openstreetmap.org/copyright");
    expect(attribution).toContain('rel="noopener noreferrer"');
  });
});

describe("buildMapOptions", () => {
  it("centers the map on the venue with the venue zoom", () => {
    const options = buildMapOptions(EVENT_VENUE, { isTouch: false });

    expect(options.center).toEqual([21.04958, -86.84682]);
    expect(options.zoom).toBe(EVENT_VENUE.mapZoom);
  });

  it("keeps the wheel for the page until the visitor asks for the map", () => {
    expect(buildMapOptions(EVENT_VENUE, { isTouch: false }).scrollWheelZoom).toBe(false);
  });

  it("leaves one finger for scrolling the page on a touch screen, and keeps the pinch", () => {
    const touch = buildMapOptions(EVENT_VENUE, { isTouch: true });

    expect(touch.dragging).toBe(false);
    expect(touch.touchZoom).toBe(true);
    expect(buildMapOptions(EVENT_VENUE, { isTouch: false }).dragging).toBe(true);
  });

  it("can be used with the keyboard and draws its own zoom control", () => {
    const options = buildMapOptions(EVENT_VENUE, { isTouch: false });

    expect(options.keyboard).toBe(true);
    expect(options.zoomControl).toBe(false);
  });
});

describe("shouldShowFallback", () => {
  it("shows the schematic without a connection", () => {
    expect(shouldShowFallback({ isOnline: false, loadedTiles: 12, failedTiles: 0 })).toBe(true);
  });

  it("keeps the map while the tiles load", () => {
    expect(shouldShowFallback({ isOnline: true, loadedTiles: 0, failedTiles: 0 })).toBe(false);
    expect(shouldShowFallback({ isOnline: true, loadedTiles: 6, failedTiles: 3 })).toBe(false);
  });

  it("shows the schematic when the tiles fail and none has loaded", () => {
    expect(shouldShowFallback({ isOnline: true, loadedTiles: 0, failedTiles: TILE_ERROR_LIMIT })).toBe(true);
  });
});
