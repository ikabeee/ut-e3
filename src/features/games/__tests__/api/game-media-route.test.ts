/**
 * @jest-environment node
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { GET } from "@features/games/api/game-media-route";

const uploadsDirectory = mkdtempSync(path.join(tmpdir(), "ut-e3-test-media-"));

process.env.UPLOADS_DIR = uploadsDirectory;

const BYTES = Uint8Array.from([0xff, 0xd8, 0xff, 0xd9]);

beforeAll(() => {
  mkdirSync(path.join(uploadsDirectory, "games"), { recursive: true });
  writeFileSync(path.join(uploadsDirectory, "games", "ruta-9-abcd1234.jpg"), BYTES);
  writeFileSync(path.join(uploadsDirectory, "secret.jpg"), BYTES);
});

afterAll(() => rmSync(uploadsDirectory, { recursive: true, force: true }));

describe("GET /api/media/games/[file]", () => {
  it("serves the image as a JPEG that never changes", async () => {
    const response = await GET(
      new Request("http://localhost/api/media/games/ruta-9-abcd1234.jpg"),
      context("ruta-9-abcd1234.jpg"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/jpeg");
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=31536000, immutable");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(BYTES);
  });

  it("answers 404 for a file that does not exist", async () => {
    const response = await GET(new Request("http://localhost/x"), context("nada-12345678.jpg"));

    expect(response.status).toBe(404);
  });

  it.each([
    "../secret.jpg",
    "..%2Fsecret.jpg",
    "%2e%2e%2fsecret.jpg",
    "secret.JPG",
    "a.jpg.png",
    "a--b.jpg",
    "-a.jpg",
    "a/b.jpg",
    "RUTA.jpg",
    "ruta-9.png",
    "ruta 9.jpg",
    ".jpg",
    "",
  ])("answers 404 for the name %s, which is not a name the app writes", async (file) => {
    expect((await GET(new Request("http://localhost/x"), context(file))).status).toBe(404);
  });
});

function context(file: string) {
  return { params: Promise.resolve({ file }) };
}
