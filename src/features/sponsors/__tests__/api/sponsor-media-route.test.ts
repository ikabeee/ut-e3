/**
 * @jest-environment node
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { GET } from "@features/sponsors/api/sponsor-media-route";

const uploadsDirectory = mkdtempSync(path.join(tmpdir(), "ut-e3-test-sponsor-media-"));

process.env.UPLOADS_DIR = uploadsDirectory;

const BYTES = Uint8Array.from([1, 2, 3, 4]);

const FILES = {
  png: "sponsor-nodo-caribe-0123456789ab.png",
  jpg: "sponsor-nodo-caribe-0123456789ab.jpg",
  webp: "sponsor-nodo-caribe-0123456789ab.webp",
};

beforeAll(() => {
  mkdirSync(path.join(uploadsDirectory, "sponsors"), { recursive: true });

  for (const file of Object.values(FILES)) writeFileSync(path.join(uploadsDirectory, "sponsors", file), BYTES);

  writeFileSync(path.join(uploadsDirectory, "sponsors", "sponsor-a-0123456789ab.svg"), "<svg/>");
  writeFileSync(path.join(uploadsDirectory, "secret.png"), BYTES);
});

afterAll(() => rmSync(uploadsDirectory, { recursive: true, force: true }));

describe("GET /api/media/sponsors/[file] (S3)", () => {
  it.each([
    ["png", "image/png"],
    ["jpg", "image/jpeg"],
    ["webp", "image/webp"],
  ] as const)("serves a .%s as %s that never changes, without sniffing", async (extension, contentType) => {
    const response = await GET(new Request("http://localhost/x"), context(FILES[extension]));

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(contentType);
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=31536000, immutable");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(BYTES);
  });

  it("answers 404 for a file that does not exist", async () => {
    expect((await GET(new Request("http://localhost/x"), context("sponsor-nada-0123456789ab.png"))).status).toBe(404);
  });

  it.each([
    "../secret.png",
    "..%2Fsecret.png",
    "%2e%2e%2fsecret.png",
    "sponsor-a-0123456789ab.svg",
    "sponsor-nodo-caribe-0123456789ab.PNG",
    "sponsor-nodo-caribe-0123456789ab.png.jpg",
    "sponsor-nodo-caribe/../../secret-0123456789ab.png",
    "sponsor-a/b-0123456789ab.png",
    "secret.png",
    "",
  ])("answers 404 for the name %s, which is not a name the app writes", async (file) => {
    expect((await GET(new Request("http://localhost/x"), context(file))).status).toBe(404);
  });
});

function context(file: string) {
  return { params: Promise.resolve({ file }) };
}
