import type { MetadataRoute } from "next";
import {
  ACTIVATE_PATH,
  FORGOT_PASSWORD_PATH,
  LOGIN_PATH,
  RESET_PASSWORD_PATH,
} from "@features/accounts/lib/accounts-links";
import { OFFLINE_PATH } from "@features/pwa/lib/pwa-links";
import { STAFF_AREAS } from "@features/site/lib/staff-areas";
import { PASSPORT_PATH } from "@features/visitors/lib/visitors-links";
import { siteConfig } from "@shared/lib/site-config";

// Every Route Handler: the visitors' own data and the staff tools. The pictures of the games come from the uploads
// volume through /api/media/games/, and the search engines need them to show the games, so that folder stays open.
const API_PATH = "/api/";

const PUBLIC_MEDIA_PATH = "/api/media/";

// The areas behind a session or a one-use link. The pages that are live data (/tournament, /raffle/live) are not
// here: a page closed to the crawler cannot say that it must not be indexed, so they say it themselves.
const PRIVATE_PATHS = [
  ...STAFF_AREAS,
  LOGIN_PATH,
  ACTIVATE_PATH,
  FORGOT_PASSWORD_PATH,
  RESET_PASSWORD_PATH,
  PASSPORT_PATH,
  OFFLINE_PATH,
  API_PATH,
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: ["/", PUBLIC_MEDIA_PATH], disallow: PRIVATE_PATHS },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
