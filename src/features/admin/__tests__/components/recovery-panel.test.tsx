import { render, screen, within } from "@testing-library/react";
import { RecoveryPanel, type RecoveryActions } from "@features/admin/components/recovery-panel";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { ADMIN_BACKUP_PATH } from "@features/admin/lib/admin-links";
import type { RecoveryStatus } from "@features/admin/lib/types";

const COPY = ADMIN_COPY.recovery;

const ACTION = async () => ({ status: "done" as const, message: "listo" });

const ACTIONS: RecoveryActions = {
  testSmtp: ACTION,
  retryEmails: ACTION,
  restartEmailWorker: ACTION,
  restartOverloadWatch: ACTION,
  runQuickCheck: ACTION,
  runCheckpoint: ACTION,
  invalidateCaches: ACTION,
};

const STATUS: RecoveryStatus = {
  mail: {
    smtpHost: "smtp.ut.mx",
    worker: { isRunning: true, lastRunAt: "2026-11-20T18:00:00.000Z", lastError: "535 clave rechazada" },
    outbox: { sent: 4, pending: 2, failed: 1 },
    lastSentAt: null,
    lastFailure: "421 Servicio no disponible",
  },
  overloadWatch: null,
  logRetention: null,
  database: { databaseBytes: 3 * 1024 * 1024, walBytes: 0, shmBytes: 32768, freeBytes: null },
  publicBracketEnabled: true,
};

describe("RecoveryPanel", () => {
  it("shows the host, the worker error and the outbox, and one button per mail action", () => {
    render(<RecoveryPanel status={STATUS} actions={ACTIONS} refreshHref="/admin/recovery" />);

    const mail = within(screen.getByTestId("recovery-mail"));

    expect(mail.getByText(COPY.mail.smtpConfigured("smtp.ut.mx"))).toBeInTheDocument();
    expect(mail.getByText(COPY.lastError("535 clave rechazada"))).toBeInTheDocument();
    expect(mail.getByText(COPY.mail.outbox(4, 2, 1))).toBeInTheDocument();
    expect(mail.getByRole("button", { name: COPY.mail.testSmtp })).toBeInTheDocument();
    expect(mail.getByRole("button", { name: COPY.mail.retry })).toBeInTheDocument();
    expect(mail.getByRole("button", { name: COPY.mail.restart })).toBeInTheDocument();
  });

  it("says the watch is not running when it has no job", () => {
    render(<RecoveryPanel status={STATUS} actions={ACTIONS} refreshHref="/admin/recovery" />);

    expect(within(screen.getByTestId("recovery-overload")).getByText(COPY.notStarted)).toBeInTheDocument();
  });

  it("shows the sizes of the database files and links the backup download", () => {
    render(<RecoveryPanel status={STATUS} actions={ACTIONS} refreshHref="/admin/recovery" />);

    const database = within(screen.getByTestId("recovery-database"));

    expect(database.getByText(COPY.database.files("3 MiB", "0 B", "32 KiB"))).toBeInTheDocument();
    expect(database.getByText(COPY.database.freeUnknown)).toBeInTheDocument();
    expect(database.getByRole("link", { name: COPY.database.backup })).toHaveAttribute("href", ADMIN_BACKUP_PATH);
  });
});
