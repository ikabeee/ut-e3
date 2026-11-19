import "server-only";
import { createReadStream } from "node:fs";
import type { Readable } from "node:stream";
import { getSysadmin } from "@features/accounts/lib/server/current-account";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { createBackup } from "@features/admin/lib/server/database-maintenance";
import { auditRecovery } from "@features/admin/lib/server/recovery-audit";

const COPY = ADMIN_COPY.recovery;

// The copy holds every personal datum of the event: it is never cached or sniffed, and only the sysadmin gets it.
const PRIVATE_HEADERS = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

/** "Descargar respaldo": the live database copied with the online backup API and streamed to the sysadmin (RNF-16). */
export async function GET(): Promise<Response> {
  const account = await getSysadmin();

  if (!account) return textResponse(COPY.backupUnauthorized, 401);

  try {
    return await streamBackup(account.id);
  } catch (cause) {
    console.error(`Database backup failed: ${cause instanceof Error ? cause.message : "Unknown error"}`);

    return textResponse(COPY.backupFailed, 500);
  }
}

// The temporary folder goes away when the stream closes: after the last chunk, when the browser cancels, or on an error.
async function streamBackup(actorId: string): Promise<Response> {
  const backup = await createBackup();

  try {
    await auditRecovery({ actorId, action: "backup_download", target: "database", detail: { bytes: backup.bytes } });
  } catch (cause) {
    await backup.cleanup();

    throw cause;
  }

  const stream = createReadStream(backup.file);

  stream.once("close", () => void backup.cleanup());

  return new Response(toWebStream(stream), {
    headers: {
      ...PRIVATE_HEADERS,
      "Content-Type": "application/vnd.sqlite3",
      "Content-Length": String(backup.bytes),
      "Content-Disposition": `attachment; filename="${buildBackupName(new Date())}"`,
    },
  });
}

// Cancelling the web stream returns the iterator, which destroys the file stream and so closes it.
function toWebStream(stream: Readable): ReadableStream<Uint8Array> {
  const chunks: AsyncIterator<Uint8Array> = stream[Symbol.asyncIterator]();

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const chunk = await chunks.next();

      if (chunk.done) controller.close();
      else controller.enqueue(chunk.value);
    },
    async cancel() {
      await chunks.return?.();
    },
  });
}

function buildBackupName(now: Date): string {
  const stamp = now.toISOString().replaceAll(/[-:]/g, "").slice(0, 15);

  return `ut-e3-respaldo-${stamp}.db`;
}

function textResponse(message: string, status: number): Response {
  return new Response(message, {
    status,
    headers: { ...PRIVATE_HEADERS, "Content-Type": "text/plain; charset=utf-8" },
  });
}
