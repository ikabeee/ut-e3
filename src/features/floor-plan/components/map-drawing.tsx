import type { ReactElement } from "react";
import {
  MAP_AVENUES,
  MAP_BUILDING,
  MAP_DIVIDER,
  MAP_DOTTED_STREETS,
  MAP_EXTERIOR_RECT,
  MAP_HEIGHT,
  MAP_THIN_STREETS,
  MAP_WIDTH,
  MAP_ZONE_RECTS,
} from "@features/floor-plan/lib/map-layout";

/** The static drawing of the map: streets, ground, building, wall and zone areas. */
export function MapDrawing(): ReactElement {
  return (
    <g>
      <rect x={0} y={0} width={MAP_WIDTH} height={MAP_HEIGHT} className="fill-map-ground" />
      <Avenues />
      <ThinStreets />
      <DottedStreets />
      <path d={MAP_BUILDING} className="fill-map-building" fillOpacity={0.88} />
      <path
        d={MAP_BUILDING}
        className="fill-none stroke-paper"
        strokeWidth={1.5}
        strokeOpacity={0.55}
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={MAP_DIVIDER}
        className="fill-none stroke-paper"
        strokeWidth={1}
        strokeOpacity={0.3}
        strokeDasharray="6 6"
        vectorEffect="non-scaling-stroke"
      />
      <ZoneAreas />
    </g>
  );
}

function Avenues(): ReactElement {
  return (
    <g fill="none" strokeLinecap="round" className="stroke-map-street">
      {MAP_AVENUES.map(([path, width]) => (
        <path key={path} d={path} strokeWidth={width} />
      ))}
    </g>
  );
}

function ThinStreets(): ReactElement {
  return (
    <g fill="none" className="stroke-map-line" strokeWidth={1.5}>
      {MAP_THIN_STREETS.map((path) => (
        <path key={path} d={path} />
      ))}
    </g>
  );
}

function DottedStreets(): ReactElement {
  return (
    <g fill="none" className="stroke-separator" strokeWidth={1} strokeDasharray="2 6">
      {MAP_DOTTED_STREETS.map((path) => (
        <path key={path} d={path} />
      ))}
    </g>
  );
}

function ZoneAreas(): ReactElement {
  const [exteriorX, exteriorY, exteriorWidth, exteriorHeight] = MAP_EXTERIOR_RECT;

  return (
    <g className="fill-map-zone stroke-border" strokeWidth={1} strokeDasharray="4 4">
      {MAP_ZONE_RECTS.map(([x, y, width, height]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={width} height={height} data-zone-area="true" />
      ))}
      <rect x={exteriorX} y={exteriorY} width={exteriorWidth} height={exteriorHeight} data-zone-area="true" />
    </g>
  );
}
