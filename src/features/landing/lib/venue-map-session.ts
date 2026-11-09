import type * as Leaflet from "leaflet";
import type { EventVenue } from "@features/landing/lib/types";
import {
  buildMapOptions,
  buildTileLayerOptions,
  VENUE_MAP_TILES,
  VENUE_PIN_SIZE,
} from "@features/landing/lib/venue-map";

export interface VenueMapLabels {
  zoomIn: string;
  zoomOut: string;
  /** The two lines of the pin: the event name and the venue. */
  pinName: string;
  pinPlace: string;
}

export interface TileCounts {
  loaded: number;
  failed: number;
}

interface StartVenueMapInput {
  container: HTMLElement;
  venue: EventVenue;
  labels: VenueMapLabels;
  /** The public Mapbox token of the tile URL. */
  accessToken: string;
  onTiles: (counts: TileCounts) => void;
}

export interface VenueMapSession {
  destroy: () => void;
}

/** Loads Leaflet in the browser (it needs `window`) and draws the venue map in `container`. */
export async function startVenueMap({
  container,
  venue,
  labels,
  accessToken,
  onTiles,
}: StartVenueMapInput): Promise<VenueMapSession> {
  const leaflet = await loadLeaflet();
  const isTouch = window.matchMedia("(pointer: coarse)").matches;
  const map = leaflet.map(container, buildMapOptions(venue, { isTouch }));

  map.attributionControl.setPrefix(false);
  leaflet.control.zoom({ position: "topright", zoomInTitle: labels.zoomIn, zoomOutTitle: labels.zoomOut }).addTo(map);
  watchTiles(leaflet.tileLayer(VENUE_MAP_TILES.url, buildTileLayerOptions(accessToken)).addTo(map), onTiles);
  addMapboxLogo(leaflet, map);
  addVenuePin(leaflet, map, { venue, labels });

  const stopWheelGuard = guardWheelZoom(map, container);

  return {
    destroy: () => {
      stopWheelGuard();
      map.remove();
    },
  };
}

async function loadLeaflet(): Promise<typeof Leaflet> {
  const loaded: typeof Leaflet & { default?: typeof Leaflet } = await import("leaflet");

  return loaded.default ?? loaded;
}

function watchTiles(layer: Leaflet.TileLayer, onTiles: (counts: TileCounts) => void) {
  const counts: TileCounts = { loaded: 0, failed: 0 };

  layer.on("tileload", () => onTiles({ ...counts, loaded: ++counts.loaded }));
  layer.on("tileerror", () => onTiles({ ...counts, failed: ++counts.failed }));
}

/** Mapbox requires its logo, linked to mapbox.com, on every map that shows its tiles. */
function addMapboxLogo(leaflet: typeof Leaflet, map: Leaflet.Map) {
  const logo = new leaflet.Control({ position: "bottomleft" });

  logo.onAdd = () => {
    const link = document.createElement("a");

    link.className = "venue-map__logo";
    link.href = VENUE_MAP_TILES.logo.href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", VENUE_MAP_TILES.logo.label);

    return link;
  };

  logo.addTo(map);
}

interface PinInput {
  venue: EventVenue;
  labels: VenueMapLabels;
}

function addVenuePin(leaflet: typeof Leaflet, map: Leaflet.Map, { venue, labels }: PinInput) {
  const { width, height } = VENUE_PIN_SIZE;

  const icon = leaflet.divIcon({
    html: buildPinElement(labels),
    className: "venue-pin-icon",
    iconSize: [width, height],
    iconAnchor: [width / 2, height],
  });

  leaflet
    .marker([venue.coordinates.latitude, venue.coordinates.longitude], { icon, interactive: false, keyboard: false })
    .addTo(map);
}

function buildPinElement({ pinName, pinPlace }: VenueMapLabels): HTMLElement {
  const pin = document.createElement("div");

  const parts = [
    ["venue-pin__name", pinName],
    ["venue-pin__place", pinPlace],
    ["venue-pin__line", ""],
  ];

  pin.className = "venue-pin";
  parts.forEach(([className, text]) => {
    const part = document.createElement("span");

    part.className = className;
    part.textContent = text;
    pin.append(part);
  });

  return pin;
}

/** The wheel zooms only after a click on the map or with ctrl; otherwise it keeps scrolling the page. */
function guardWheelZoom(map: Leaflet.Map, container: HTMLElement): () => void {
  const enable = () => map.scrollWheelZoom.enable();
  const disable = () => map.scrollWheelZoom.disable();

  const onWheel = (event: WheelEvent) => {
    if (event.ctrlKey) {
      event.preventDefault();
      enable();
    }
  };

  map.on("click", enable);
  container.addEventListener("mouseleave", disable);
  container.addEventListener("wheel", onWheel, { passive: false });

  return () => {
    container.removeEventListener("mouseleave", disable);
    container.removeEventListener("wheel", onWheel);
  };
}
