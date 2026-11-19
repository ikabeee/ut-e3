/**
 * @jest-environment node
 */
import type * as NextCache from "next/cache";
import { createEventSettings, createPublicGame } from "@app/__tests__/metadata-test-data";
import Image, { alt, contentType, size } from "@app/opengraph-image";
import GameImage, {
  alt as gameAlt,
  contentType as gameContentType,
  size as gameSize,
} from "@app/games/[slug]/opengraph-image";
import { generateGameDetailPageMetadata } from "@features/games/pages/game-detail-page";
import { getPrisma } from "@shared/lib/server/prisma";
import { siteConfig } from "@shared/lib/site-config";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

// cacheLife and cacheTag only run inside Next; the spies replace them on the module object the queries read.
const nextCache = jest.requireActual<typeof NextCache>("next/cache");

jest.spyOn(nextCache, "cacheLife").mockImplementation(() => undefined);

jest.spyOn(nextCache, "cacheTag").mockImplementation(() => undefined);

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

beforeAll(async () => {
  await createEventSettings();
  await createPublicGame("true-hero", 1);
});

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

// Jest cannot run the renderer of next/og (a dynamic import() needs --experimental-vm-modules), so the response is
// checked by its head; `next build` prerenders /opengraph-image and draws the picture.
function expectPngResponse(response: Response) {
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe("image/png");
  expect(response.headers.get("cache-control")).toContain("max-age=3600");
}

describe("the Open Graph image of the site (/opengraph-image)", () => {
  it("declares its alt text, size and type", () => {
    expect(alt).toBe(siteConfig.title);
    expect(size).toEqual({ width: 1200, height: 630 });
    expect(contentType).toBe("image/png");
  });

  it("answers a PNG once it has read the settings of the event", async () => {
    expectPngResponse(await Image());
  });
});

describe("the Open Graph image of a game (/games/[slug]/opengraph-image)", () => {
  it("declares its alt text, size and type", () => {
    expect(gameAlt).toEqual(expect.any(String));
    expect(gameSize).toEqual({ width: 1200, height: 630 });
    expect(gameContentType).toBe("image/png");
  });

  it("answers a PNG for a game of the catalog", async () => {
    expectPngResponse(await GameImage({ params: Promise.resolve({ slug: "true-hero" }) }));
  });

  it("falls back to the image of the site for a slug that is not a game, instead of failing", async () => {
    for (const slug of ["no-existe", "../etc", "X.png"]) {
      expectPngResponse(await GameImage({ params: Promise.resolve({ slug }) }));
    }
  });
});

describe("the metadata of a game page", () => {
  it("shares the generated image of its own game, with its own canonical", async () => {
    const metadata = await generateGameDetailPageMetadata({
      params: Promise.resolve({ slug: "true-hero" }),
      searchParams: Promise.resolve({}),
    });

    expect(metadata.alternates?.canonical).toBe("/games/true-hero");
    expect(metadata.openGraph).toMatchObject({
      url: "/games/true-hero",
      images: [
        {
          url: "/games/true-hero/opengraph-image",
          width: 1200,
          height: 630,
          alt: "Ficha de true-hero en PIXEL & CODE",
        },
      ],
    });
    expect(metadata.robots).toBeUndefined();
  });
});
