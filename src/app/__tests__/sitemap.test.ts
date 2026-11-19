/**
 * @jest-environment node
 */
import type { MetadataRoute } from "next";
import type * as NextCache from "next/cache";
import { createGameWithoutArtwork, createPublicGame } from "@app/__tests__/metadata-test-data";
import { getPrisma } from "@shared/lib/server/prisma";
import { siteConfig } from "@shared/lib/site-config";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const PUBLIC_PATHS = ["/", "/games", "/sponsors", "/floor-plan", "/raffle", "/register", "/privacy", "/help"];

// cacheLife and cacheTag only run inside Next; the spies replace them on the module object the query reads.
const nextCache = jest.requireActual<typeof NextCache>("next/cache");

jest.spyOn(nextCache, "cacheLife").mockImplementation(() => undefined);

jest.spyOn(nextCache, "cacheTag").mockImplementation(() => undefined);

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

// The kill switch is read once when the module loads, so each mode gets its own copy of the sitemap.
async function loadSitemap(mode: "landing" | "full"): Promise<() => Promise<MetadataRoute.Sitemap>> {
  const previous = process.env.SITE_MODE;

  process.env.SITE_MODE = mode;

  try {
    let sitemap: (() => Promise<MetadataRoute.Sitemap>) | undefined;

    await jest.isolateModulesAsync(async () => {
      const cache = jest.requireActual<typeof NextCache>("next/cache");

      jest.spyOn(cache, "cacheLife").mockImplementation(() => undefined);
      jest.spyOn(cache, "cacheTag").mockImplementation(() => undefined);
      sitemap = (await import("@app/sitemap")).default;
    });

    if (!sitemap) throw new Error("The sitemap did not load.");

    return sitemap;
  } finally {
    if (previous === undefined) delete process.env.SITE_MODE;
    else process.env.SITE_MODE = previous;
  }
}

function urls(entries: MetadataRoute.Sitemap): string[] {
  return entries.map((entry) => entry.url);
}

function absolute(path: string): string {
  return new URL(path, siteConfig.url).toString();
}

describe("sitemap in full mode", () => {
  beforeAll(async () => {
    await createPublicGame("true-hero", 1);
    await createPublicGame("one-mind", 2);
    await createGameWithoutArtwork("sombra-del-mictlan", 3);
  });

  it("lists the public pages and one page for each game of the public catalog, with absolute addresses", async () => {
    const sitemap = await loadSitemap("full");

    expect(urls(await sitemap())).toEqual([...PUBLIC_PATHS, "/games/true-hero", "/games/one-mind"].map(absolute));
  });

  it("leaves out the games without artwork, the live pages and every private area", async () => {
    const found = urls(await (await loadSitemap("full"))());

    expect(found).not.toContain(absolute("/games/sombra-del-mictlan"));

    for (const path of ["/tournament", "/raffle/live", "/passport", "/passport/recover", "/login", "/offline"]) {
      expect(found).not.toContain(absolute(path));
    }

    expect(found.filter((url) => /\/(admin|stand|support|api|my-role)(\/|$)/.test(url))).toEqual([]);
  });
});

describe("sitemap in landing mode", () => {
  it("lists only the landing and does not read the games", async () => {
    const sitemap = await loadSitemap("landing");

    expect(urls(await sitemap())).toEqual([absolute("/")]);
  });
});
