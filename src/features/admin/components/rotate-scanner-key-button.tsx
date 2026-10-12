"use client";

import { useState } from "react";
import { AdminActionButton } from "@features/admin/components/admin-action-button";
import { ScannerKeyAlert } from "@features/admin/components/scanner-key-alert";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { rotateTeamScannerKeyAction } from "@features/teams/lib/teams-actions";

interface RotateScannerKeyButtonProps {
  teamId: string;
}

/** Genera una llave nueva para el escáner del equipo y la muestra una vez. */
export function RotateScannerKeyButton({ teamId }: Readonly<RotateScannerKeyButtonProps>) {
  const [scannerKey, setScannerKey] = useState<string | null>(null);

  const rotate = async () => {
    const result = await rotateTeamScannerKeyAction(teamId);
    setScannerKey(result.ok ? result.data.scannerKey : null);
    return result;
  };

  return (
    <div className="flex flex-col gap-3">
      <AdminActionButton
        action={rotate}
        label={ADMIN_COPY.teams.rotateKey}
        confirmLabel={ADMIN_COPY.teams.rotateKeyConfirm}
      />
      {scannerKey ? <ScannerKeyAlert scannerKey={scannerKey} /> : null}
    </div>
  );
}
