import { readFileSync } from "node:fs";
import { loadEnvConfig } from "@next/env";
import { inviteStaffFromCsv, type BulkInviteResult } from "@features/accounts/lib/server/staff-bulk-invite";
import { INITIAL_STANDS } from "@features/games/lib/server/games-seed";
import { getPrisma } from "@shared/lib/server/prisma";

// Runs with `npm run db:invite:staff [archivo.csv]` (`tsx --conditions=react-server prisma/invite-staff.ts`) and, in the
// container, from docker/entrypoint.sh when the file exists. The list is the CSV of docs/deploy.md, "Alta masiva del
// staff": argv, or STAFF_INVITATIONS_CSV, or /data/staff-invitations.csv. It runs once: after a successful run the audit
// log holds `staff.bulk_invite` and every later run exits 0 without reading the file. The emails stay queued; the mail
// worker of the app sends them.
loadEnvConfig(process.cwd());

const DEFAULT_CSV_PATH = "/data/staff-invitations.csv";

inviteAndReport().catch(reportFailure);

async function inviteAndReport(): Promise<void> {
  const csvPath = process.argv[2] ?? process.env.STAFF_INVITATIONS_CSV ?? DEFAULT_CSV_PATH;

  try {
    const result = await inviteStaffFromCsv({
      readCsv: () => readFileSync(csvPath, "utf8"),
      stands: INITIAL_STANDS,
      now: new Date(),
    });

    report(result);
  } finally {
    await getPrisma().$disconnect();
  }
}

function report(result: BulkInviteResult): void {
  if (result.status === "alreadyDone") {
    console.log("Alta masiva del staff: ya se ejecutó, no se hizo nada. El sysadmin reenvía desde /admin/accounts.");

    return;
  }

  if (result.status === "invalid") {
    console.error("Alta masiva del staff: la lista no es válida y no se escribió nada.");

    for (const { line, message } of result.errors)
      console.error(line === null ? `- ${message}` : `- Línea ${line}: ${message}`);

    process.exitCode = 1;

    return;
  }

  console.log(
    `Alta masiva del staff: ${result.invited} invitaciones en cola y ${result.createdStands} stands creados.`,
  );
  console.log(`Correos que ya tenían cuenta (líneas, no se tocaron): ${result.skippedLines.join(", ") || "ninguno"}.`);
  console.log(
    `Personas sin correo (líneas, omitidas): ${result.omitted.map(({ line }) => line).join(", ") || "ninguna"}.`,
  );
  console.log("Los correos salen por el trabajador de correo de la app; revisa /admin/emails.");
}

function reportFailure(error: Error): void {
  console.error(error);
  process.exitCode = 1;
}
