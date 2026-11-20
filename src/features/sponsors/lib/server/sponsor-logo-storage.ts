import "server-only";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { isSponsorLogoFileName } from "@features/sponsors/lib/sponsor-logo";

export async function storeSponsorLogo(fileName: string, bytes: Uint8Array): Promise<void> {
  await mkdir(getLogosDirectory(), { recursive: true });
  await writeFile(buildFilePath(fileName), bytes);
}

export async function removeSponsorLogo(fileName: string): Promise<void> {
  if (isSponsorLogoFileName(fileName)) await rm(buildFilePath(fileName), { force: true });
}

export function sponsorLogoExists(fileName: string): boolean {
  return isSponsorLogoFileName(fileName) && existsSync(buildFilePath(fileName));
}

/** The bytes of a stored logo, or null when there is none or the name is not one the app writes. */
export async function readSponsorLogo(fileName: string): Promise<Buffer | null> {
  if (!isSponsorLogoFileName(fileName)) return null;

  try {
    return await readFile(buildFilePath(fileName));
  } catch {
    return null;
  }
}

// Every caller passes a name that isSponsorLogoFileName accepted, so the file stays inside the logos folder.
function buildFilePath(fileName: string): string {
  return path.join(getLogosDirectory(), fileName);
}

function getLogosDirectory(): string {
  return path.join(getUploadsDirectory(), "sponsors");
}

// `UPLOADS_DIR` is the Docker volume (`/data/uploads`); in development the uploads go to `data/uploads` in the project.
function getUploadsDirectory(): string {
  return process.env.UPLOADS_DIR?.trim() || path.join(process.cwd(), "data", "uploads");
}
