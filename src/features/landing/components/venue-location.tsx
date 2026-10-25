import { CopyAddressButton } from "@features/landing/components/copy-address-button";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";
import { VENUE_SECTION_ID } from "@features/landing/lib/landing-links";
import type { EventVenue } from "@features/landing/lib/types";
import { formatCopyableAddress, formatVenueAddress } from "@features/landing/lib/venue";
import { ActionLink } from "@shared/components/action-link";
import { PaperCard } from "@shared/components/paper-card";
import { siteConfig } from "@shared/lib/site-config";

const MONO = "var(--font-mono)";

const WIDE = "var(--font-wide)";

const ROAD_PATH = "M70 40 C140 140 250 210 300 250 S430 330 470 370";

const DOT_STEP = 24;

interface VenueLocationProps {
  venue: EventVenue;
}

export function VenueLocation({ venue }: Readonly<VenueLocationProps>) {
  return (
    <section id={VENUE_SECTION_ID} className="section-block">
      <div className="page-wrap">
        <p className="mb-[18px] type-tiny">{venue.landmark}</p>
        <h2 className="type-giant">{LANDING_COPY.venue.heading}</h2>
        <div className="mt-[clamp(36px,5vw,64px)] grid grid-cols-[.85fr_1.15fr] gap-gutter max-[860px]:grid-cols-1">
          <VenueDetails venue={venue} />
          <div className="min-w-0 overflow-hidden border border-border bg-background">
            <VenueSchematic venue={venue} />
          </div>
        </div>
      </div>
    </section>
  );
}

function VenueDetails({ venue }: Readonly<VenueLocationProps>) {
  return (
    <article className="flex min-w-0 flex-col">
      <PaperCard className="flex-1 gap-3 px-[22px] pt-[22px] pb-7">
        <span className="type-tiny">{LANDING_COPY.venue.kicker}</span>
        <h3 className="font-wide text-[clamp(22px,2.8vw,38px)] leading-[.95] font-bold tracking-[-.03em] uppercase">
          {venue.name}
        </h3>
        <p className="m-0 max-w-[40ch] text-lg leading-[1.2]">{formatVenueAddress(venue)}</p>
      </PaperCard>
      <div className="flex flex-wrap justify-end">
        <CopyAddressButton address={formatCopyableAddress(venue)} />
        <ActionLink href={venue.mapsUrl} variant="primary" size="lg" arrow="ne" isExternal>
          {LANDING_COPY.venue.openMaps}
        </ActionLink>
      </div>
    </article>
  );
}

function VenueSchematic({ venue }: Readonly<VenueLocationProps>) {
  return (
    <svg
      viewBox="0 0 600 400"
      role="img"
      aria-label={LANDING_COPY.venue.map.label(venue.shortName)}
      className="block h-auto w-full"
    >
      <SchematicBackdrop />
      <SchematicRoad />
      <SchematicCampus venue={venue} />
    </svg>
  );
}

function SchematicBackdrop() {
  const { map } = LANDING_COPY.venue;

  return (
    <>
      <defs>
        <pattern id="venue-dots" x={12} y={12} width={DOT_STEP} height={DOT_STEP} patternUnits="userSpaceOnUse">
          <rect width={1.2} height={1.2} fill="var(--border)" />
        </pattern>
      </defs>
      <rect width={600} height={400} fill="var(--background)" />
      <rect x={12} y={12} width={588} height={388} fill="url(#venue-dots)" />
      <path d="M520 0 C500 120 560 220 530 400 H600 V0 Z" fill="var(--surface)" />
      <SchematicLabel x={540} y={30} size={10} fill="var(--muted)" text={map.sea} />
      <SchematicLabel x={14} y={390} size={10} fill="var(--muted)" text={map.notToScale} />
    </>
  );
}

function SchematicRoad() {
  const { map } = LANDING_COPY.venue;

  return (
    <>
      <path d={ROAD_PATH} stroke="var(--foreground)" strokeWidth={2} fill="none" />
      <path d={ROAD_PATH} stroke="var(--foreground)" strokeWidth={12} strokeOpacity={0.08} fill="none" />
      <rect x={64} y={34} width={12} height={12} fill="var(--foreground)" />
      <rect x={464} y={364} width={12} height={12} fill="var(--foreground)" />
      <SchematicLabel x={88} y={44} size={11} fill="var(--foreground)" text={map.downtown} />
      <SchematicLabel x={366} y={394} size={11} fill="var(--foreground)" text={map.airport} />
    </>
  );
}

function SchematicCampus({ venue }: Readonly<VenueLocationProps>) {
  return (
    <>
      <rect x={262} y={142} width={100} height={70} fill="var(--accent)" />
      <text
        x={274}
        y={178}
        fontSize={24}
        fontWeight={900}
        fill="var(--background)"
        style={{ fontFamily: WIDE, fontVariationSettings: "'wdth' 125" }}
      >
        {siteConfig.name}
      </text>
      <SchematicLabel x={274} y={200} size={10} fill="var(--background)" text={venue.shortName} />
      <line x1={300} y1={212} x2={300} y2={248} stroke="var(--accent)" strokeWidth={2} />
      <SchematicLabel x={56} y={282} size={11} fill="var(--accent)" text={venue.landmark} />
    </>
  );
}

interface SchematicLabelProps {
  x: number;
  y: number;
  size: number;
  fill: string;
  text: string;
}

function SchematicLabel({ x, y, size, fill, text }: Readonly<SchematicLabelProps>) {
  return (
    <text x={x} y={y} fontSize={size} fill={fill} style={{ fontFamily: MONO }}>
      {text.toLocaleUpperCase("es")}
    </text>
  );
}
