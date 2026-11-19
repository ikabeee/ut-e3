import { buttonVariants } from "@heroui/react";
import { RecoveryActionForm, type RecoveryAction } from "@features/admin/components/recovery-action-form";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { ADMIN_BACKUP_PATH } from "@features/admin/lib/admin-links";
import type { RecoveryStatus } from "@features/admin/lib/types";

interface RecoveryDatabaseSectionProps {
  database: RecoveryStatus["database"];
  runQuickCheck: RecoveryAction;
  runCheckpoint: RecoveryAction;
}

const COPY = ADMIN_COPY.recovery.database;

const UNITS = ADMIN_COPY.recovery.units;

const KIBIBYTE = 1024;

/** The files of the database, the free space of its volume and the maintenance actions, with the backup download. */
export function RecoveryDatabaseSection({
  database,
  runQuickCheck,
  runCheckpoint,
}: Readonly<RecoveryDatabaseSectionProps>) {
  return (
    <section aria-labelledby="recovery-database-heading" className="grid gap-3" data-testid="recovery-database">
      <h2 id="recovery-database-heading" className="type-section">
        {COPY.heading}
      </h2>
      <p>
        {COPY.files(formatSize(database.databaseBytes), formatSize(database.walBytes), formatSize(database.shmBytes))}
      </p>
      <p>{database.freeBytes === null ? COPY.freeUnknown : COPY.free(formatSize(database.freeBytes))}</p>
      <p className="text-sm text-muted">{COPY.lead}</p>
      <div className="flex flex-wrap items-start gap-3">
        <RecoveryActionForm action={runQuickCheck} label={COPY.quickCheck} pendingLabel={COPY.checkingIntegrity} />
        <RecoveryActionForm action={runCheckpoint} label={COPY.checkpoint} pendingLabel={COPY.checkpointing} />
        <a href={ADMIN_BACKUP_PATH} download className={buttonVariants({ variant: "primary", className: "min-h-11" })}>
          {COPY.backup}
        </a>
      </div>
      <p role="note" className="border border-warning p-3 text-sm">
        {COPY.backupWarning}
      </p>
    </section>
  );
}

function formatSize(bytes: number): string {
  const units = [UNITS.bytes, UNITS.kibibytes, UNITS.mebibytes, UNITS.gibibytes];
  let value = bytes;
  let unit = 0;

  while (value >= KIBIBYTE && unit < units.length - 1) {
    value /= KIBIBYTE;
    unit += 1;
  }

  return `${unit === 0 ? value : value.toLocaleString("es-MX", { maximumFractionDigits: 1 })} ${units[unit]}`;
}
