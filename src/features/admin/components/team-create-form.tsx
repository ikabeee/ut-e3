"use client";

import { useState } from "react";
import { AdminActionForm } from "@features/admin/components/admin-action-form";
import { ScannerKeyAlert } from "@features/admin/components/scanner-key-alert";
import { TeamFields } from "@features/admin/components/team-fields";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { createTeamAction } from "@features/teams/lib/teams-actions";
import type { RawInput } from "@shared/lib/validation";

/** Alta de un equipo; al terminar muestra la llave de su escáner (una sola vez). */
export function TeamCreateForm() {
  const [scannerKey, setScannerKey] = useState<string | null>(null);

  const createAndKeepKey = async (input: RawInput) => {
    const result = await createTeamAction(input);
    setScannerKey(result.ok ? result.data.scannerKey : null);
    return result;
  };

  return (
    <div className="flex flex-col gap-4">
      <AdminActionForm
        action={createAndKeepKey}
        submitLabel={ADMIN_COPY.teams.create}
        successMessage={ADMIN_COPY.teams.created}
        resetOnSuccess
      >
        <TeamFields />
      </AdminActionForm>
      {scannerKey ? <ScannerKeyAlert scannerKey={scannerKey} /> : null}
    </div>
  );
}
