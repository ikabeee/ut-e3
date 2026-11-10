import { EVENT_VENUE } from "@features/landing/lib/venue";
import {
  buildMapOptions,
  buildTileLayerOptions,
  parseMapboxToken,
  shouldShowFallback,
  TILE_ERROR_LIMIT,
  VENUE_MAP_TILES,
} from "@features/landing/lib/venue-map";

const PUBLIC_TOKEN = "pk.example-public-token";

describe("venue map tiles", () => {
  it("uses the dark style of Mapbox, with the token as a placeholder and never written in the URL", () => {
    expect(VENUE_MAP_TILES.url).toBe(
      "https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}{r}?access_token={accessToken}",
    );
  });

  it("asks for the 512 px tiles of Mapbox with the token it is given", () => {
    const options = buildTileLayerOptions(PUBLIC_TOKEN);

    expect(options.accessToken).toBe(PUBLIC_TOKEN);
    expect(options.tileSize).toBe(512);
    expect(options.zoomOffset).toBe(-1);
  });

  it("never asks for a zoom the tiles do not have", () => {
    const { minZoom, maxZoom } = buildTileLayerOptions(PUBLIC_TOKEN);

    expect(maxZoom).toBeLessThanOrEqual(22);
    expect(EVENT_VENUE.mapZoom).toBeGreaterThanOrEqual(minZoom ?? 0);
    expect(EVENT_VENUE.mapZoom).toBeLessThanOrEqual(maxZoom ?? 0);
  });

  it("credits Mapbox and OpenStreetMap and links to Improve this map, as Mapbox requires", () => {
    const { attribution } = buildTileLayerOptions(PUBLIC_TOKEN);

    expect(attribution).toContain('href="https://www.mapbox.com/about/maps/"');
    expect(attribution).toContain("&copy; Mapbox</a>");
    expect(attribution).toContain('href="https://www.openstreetmap.org/copyright"');
    expect(attribution).toContain("&copy; OpenStreetMap</a>");
    expect(attribution).toContain('href="https://apps.mapbox.com/feedback/"');
    expect(attribution).toContain("Improve this map</a>");
    expect(attribution?.match(/rel="noopener noreferrer"/g)).toHaveLength(3);
  });

  it("links the Mapbox logo to mapbox.com", () => {
    expect(VENUE_MAP_TILES.logo).toEqual({ href: "https://www.mapbox.com/", label: "Mapbox" });
  });
});

describe("parseMapboxToken", () => {
  it("takes a public token, without the spaces around it", () => {
    expect(parseMapboxToken(` ${PUBLIC_TOKEN} `)).toBe(PUBLIC_TOKEN);
  });

  it.each([undefined, "", "   "])("leaves the map off without a token (%p)", (value) => {
    expect(parseMapboxToken(value)).toBe("");
  });

  it("never sends a secret token to the browser", () => {
    expect(parseMapboxToken("sk.secret-token")).toBe("");
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
