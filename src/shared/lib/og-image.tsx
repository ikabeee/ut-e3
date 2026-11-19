import { ImageResponse } from "next/og";
import type { CSSProperties, ReactElement } from "react";
import { OG_IMAGE_SIZE } from "@shared/lib/metadata";
import { siteConfig } from "@shared/lib/site-config";

/** What an Open Graph card says: the line over the title, the title, a few short facts and the line at the bottom. */
export interface OgCard {
  eyebrow: string;
  title: string;
  details: readonly string[];
  footer: string;
}

// --utg-acid, the accent of the design system. A CSS variable does not exist inside an image, so the value is repeated.
const ACCENT = "#178fdd";

const TEXT_DIM = "#b0b0b0";

const WHITE = "#ffffff";

// The image is a stable address, so it is cached for an hour and may be served stale for a day: a new event date or a
// renamed game shows up soon, and a crawler never asks for the image on every share.
const CACHE_CONTROL = "public, max-age=3600, stale-while-revalidate=86400";

/** The size of the image and how long it may be kept: what every route of the site passes to ImageResponse. */
export const OG_IMAGE_OPTIONS = { ...OG_IMAGE_SIZE, headers: { "Cache-Control": CACHE_CONTROL } };

const MAX_TITLE_LENGTH = 90;

const CARD_STYLE: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  width: "100%",
  height: "100%",
  padding: "64px 72px 56px 96px",
  background: siteConfig.backgroundColor,
  color: WHITE,
};

const ACCENT_BAR_STYLE: CSSProperties = {
  display: "flex",
  position: "absolute",
  top: 0,
  left: 0,
  bottom: 0,
  width: 24,
  background: ACCENT,
};

const TITLE_STYLE: CSSProperties = {
  display: "flex",
  maxHeight: 300,
  overflow: "hidden",
  lineHeight: 1.05,
  textTransform: "uppercase",
};

const BOTTOM_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  paddingTop: 28,
  borderTop: `4px solid ${ACCENT}`,
};

const DETAIL_STYLE: CSSProperties = {
  display: "flex",
  padding: "8px 22px",
  border: `3px solid ${WHITE}`,
  fontSize: 32,
  letterSpacing: 2,
  textTransform: "uppercase",
};

/**
 * Draws the card with the fonts that next/og brings, so nothing is downloaded when the image is made. Only flexbox
 * works inside the image, so every box with more than one child is `display: flex`.
 */
export function renderOgImage(card: OgCard): ImageResponse {
  return new ImageResponse(buildOgCardElement(card), OG_IMAGE_OPTIONS);
}

// Same text as the site: the organization over the title and the host of the site at the bottom.
export function buildSiteOgCard(details: readonly string[]): OgCard {
  return {
    eyebrow: siteConfig.organizationLabel,
    title: siteConfig.title,
    details,
    footer: new URL(siteConfig.url).host,
  };
}

export function buildOgCardElement({ eyebrow, title, details, footer }: OgCard): ReactElement {
  return (
    <div style={CARD_STYLE}>
      <div style={ACCENT_BAR_STYLE} />
      <div style={{ display: "flex", fontSize: 30, letterSpacing: 4, textTransform: "uppercase", color: ACCENT }}>
        {eyebrow}
      </div>
      <div style={{ ...TITLE_STYLE, fontSize: getOgTitleFontSize(title) }}>{clampTitle(title)}</div>
      <div style={BOTTOM_STYLE}>
        <div style={{ display: "flex", gap: 20 }}>{details.map(buildDetailElement)}</div>
        <div style={{ display: "flex", fontSize: 28, color: TEXT_DIM }}>{footer}</div>
      </div>
    </div>
  );
}

// A short title fills the card; a long one shrinks so that it never leaves it.
export function getOgTitleFontSize(title: string): number {
  if (title.length <= 18) return 112;

  if (title.length <= 32) return 88;

  return title.length <= 60 ? 68 : 54;
}

function buildDetailElement(detail: string): ReactElement {
  return (
    <div key={detail} style={DETAIL_STYLE}>
      {detail}
    </div>
  );
}

function clampTitle(title: string): string {
  return title.length > MAX_TITLE_LENGTH ? `${title.slice(0, MAX_TITLE_LENGTH - 1).trimEnd()}…` : title;
}
