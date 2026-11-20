import "server-only";
import { createHash } from "node:crypto";
import {
  buildSponsorLogoFileName,
  buildSponsorSlug,
  LOGO_MAX_BYTES,
  inspectLogoImage,
} from "@features/sponsors/lib/sponsor-logo";

export interface SponsorLogoFile {
  fileName: string;
  bytes: Uint8Array;
}

export type LogoUploadProblem = "logoFormat" | "logoTooLarge" | "logoDimensions";

export type PreparedLogoUpload =
  { status: "none" } | { status: "invalid"; reason: LogoUploadProblem } | { status: "ready"; logo: SponsorLogoFile };

const VERSION_LENGTH = 12;

/**
 * Checks the file of the form before anything is written. No file means the sponsor keeps the path that was typed. The
 * size is known before the bytes are read, so a file over the limit is never loaded into memory; then the format comes
 * from the first bytes, never from the name or the type the browser sent, and the server picks the name: the slug of
 * the sponsor, a hash of the content and the extension of what the file really is.
 */
export async function prepareLogoUpload(name: string, file: FormDataEntryValue | null): Promise<PreparedLogoUpload> {
  if (!(file instanceof File) || file.size === 0) return { status: "none" };

  if (file.size > LOGO_MAX_BYTES) return { status: "invalid", reason: "logoTooLarge" };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const inspection = inspectLogoImage(bytes);

  if (inspection.status === "notImage") return { status: "invalid", reason: "logoFormat" };

  if (inspection.status === "badSize") return { status: "invalid", reason: "logoDimensions" };

  const version = createHash("sha256").update(bytes).digest("hex").slice(0, VERSION_LENGTH);
  const fileName = buildSponsorLogoFileName(buildSponsorSlug(name), version, inspection.info.extension);

  return { status: "ready", logo: { fileName, bytes } };
}
