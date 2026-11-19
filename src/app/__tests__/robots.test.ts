import robots from "@app/robots";
import { siteConfig } from "@shared/lib/site-config";

const PRIVATE_PATHS = [
  "/admin",
  "/stand",
  "/support",
  "/my-role",
  "/login",
  "/activate",
  "/forgot-password",
  "/reset-password",
  "/passport",
  "/offline",
  "/api/",
];

describe("robots", () => {
  it("lets every crawler read the site and closes the private areas", () => {
    const { rules } = robots();

    expect(rules).toEqual({ userAgent: "*", allow: ["/", "/api/media/"], disallow: PRIVATE_PATHS });
  });

  it("points to the sitemap of the site", () => {
    expect(robots().sitemap).toBe(`${siteConfig.url}/sitemap.xml`);
  });

  it("keeps the live pages open: a page that is closed to the crawler cannot tell it not to index it", () => {
    const { rules } = robots();
    const disallow = (Array.isArray(rules) ? rules[0] : rules).disallow;

    expect(disallow).not.toContain("/tournament");
    expect(disallow).not.toContain("/raffle");
  });
});
