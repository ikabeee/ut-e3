"use client";

import { useState } from "react";
import { AdminActionForm } from "@features/admin/components/admin-action-form";
import { AdminSelectField } from "@features/admin/components/admin-select-field";
import { AdminTextField } from "@features/admin/components/admin-text-field";
import { ScannerKeyAlert } from "@features/admin/components/scanner-key-alert";
import { TeamFields } from "@features/admin/components/team-fields";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { STUDENT_GROUPS } from "@features/teams/lib/types";
import { createTeamAction } from "@features/teams/lib/teams-actions";
import type { RawInput } from "@shared/lib/validation";

const GROUP_OPTIONS = STUDENT_GROUPS.map((group) => ({ value: group, label: group }));

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
        <div className="flex flex-col gap-5">
          <TeamFields />

          <div className="flex flex-col gap-3 border-t border-border pt-4">
            <div>
              <h4 className="m-0 text-sm font-semibold text-foreground">
                Usuario líder inicial <span className="text-xs font-normal text-muted">(opcional)</span>
              </h4>
              <p className="mt-0.5 text-xs text-muted">
                Si defines al líder, se le enviará un correo de confirmación para que establezca su contraseña.
              </p>
            </div>

            <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)] gap-4 max-[760px]:grid-cols-1">
              <AdminTextField name="leaderFullName" label="Nombre completo del líder" placeholder="ej. Ana Sofía López" />
              <AdminTextField
                name="leaderEmail"
                label="Correo institucional"
                type="email"
                placeholder="ej. alopez@ute3.edu.mx"
              />
              <AdminSelectField name="leaderGroupName" label="Grupo" options={GROUP_OPTIONS} />
            </div>
          </div>
        </div>
      </AdminActionForm>
      {scannerKey ? <ScannerKeyAlert scannerKey={scannerKey} /> : null}
    </div>
  );
}
