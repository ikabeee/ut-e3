import { renderLandingOgImage } from "@features/landing/pages/landing-page";
import { OG_IMAGE_CONTENT_TYPE, OG_IMAGE_SIZE } from "@shared/lib/metadata";
import { siteConfig } from "@shared/lib/site-config";

// The image that the pages share when they have none of their own (buildOpenGraph names it): the black card of the
// design, with the title of the site and the day of the event.
export const alt = siteConfig.title;

export const size = OG_IMAGE_SIZE;

export const contentType = OG_IMAGE_CONTENT_TYPE;

export default async function Image() {
  return renderLandingOgImage();
}
