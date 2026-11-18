import "server-only";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

/** The public path of the images that stand administrators upload; the Route Handler of the media serves it. */
export const GAME_MEDIA_PATH = "/api/media/games";

// The names the app writes: the slug and the grid suffix in lowercase, then the version. Nothing else is read or served.
const GAME_MEDIA_FILE_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*\.jpg$/;

export function buildGameMediaUrl(fileName: string): string {
  return `${GAME_MEDIA_PATH}/${fileName}`;
}

/** The file name of an image path that the app stored, or null for any other path (such as the images of public/). */
export function readStoredFileName(imagePath: string): string | null {
  const prefix = `${GAME_MEDIA_PATH}/`;
  const fileName = imagePath.startsWith(prefix) ? imagePath.slice(prefix.length) : "";

  return isGameMediaFileName(fileName) ? fileName : null;
}

export async function storeGameImage(fileName: string, bytes: Uint8Array): Promise<void> {
  await mkdir(getGamesDirectory(), { recursive: true });
  await writeFile(buildFilePath(fileName), bytes);
}

export async function removeGameImage(fileName: string): Promise<void> {
  await rm(buildFilePath(fileName), { force: true });
}

/** The bytes of a stored image, or null when there is none or the name is not one the app writes. */
export async function readGameImage(fileName: string): Promise<Buffer | null> {
  if (!isGameMediaFileName(fileName)) return null;

  try {
    return await readFile(buildFilePath(fileName));
  } catch {
    return null;
  }
}

function isGameMediaFileName(fileName: string): boolean {
  return GAME_MEDIA_FILE_NAME.test(fileName);
}

function buildFilePath(fileName: string): string {
  return path.join(getGamesDirectory(), fileName);
}

function getGamesDirectory(): string {
  return path.join(getUploadsDirectory(), "games");
}

// `UPLOADS_DIR` is the Docker volume (`/data/uploads`); in development the uploads go to `data/uploads` in the project.
function getUploadsDirectory(): string {
  return process.env.UPLOADS_DIR?.trim() || path.join(process.cwd(), "data", "uploads");
}
