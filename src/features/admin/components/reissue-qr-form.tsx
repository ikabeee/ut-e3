"use client";

import { useState } from "react";
import { AdminActionForm } from "@features/admin/components/admin-action-form";
import { AdminTextField } from "@features/admin/components/admin-text-field";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import type { ReissuedVisitorQr } from "@features/visitors/lib/types";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";
import { reissueVisitorQrAction } from "@features/visitors/lib/visitors-actions";
import { QrCode } from "@shared/components/qr-code";
import { isString, type RawInput } from "@shared/lib/validation";

/** QR nuevo para un visitante que perdió el suyo: lo muestra para escanearlo en el momento. */
export function ReissueQrForm() {
  const copy = ADMIN_COPY.raffle;
  const [reissued, setReissued] = useState<ReissuedVisitorQr | null>(null);

  const reissue = async (input: RawInput) => {
    const gamertag = isString(input.gamertag) ? input.gamertag : "";
    const result = await reissueVisitorQrAction(gamertag);
    setReissued(result.ok ? result.data : null);

    return result;
  };

  return (
    <div className="flex flex-col gap-4">
      <AdminActionForm action={reissue} submitLabel={copy.reissue}>
        <div className="max-w-80">
          <AdminTextField name="gamertag" label={copy.gamertag} placeholder={copy.gamertagPlaceholder} isRequired />
        </div>
      </AdminActionForm>
      {reissued ? (
        <div className="flex flex-col gap-3">
          <p role="status" className="m-0 text-sm">
            {copy.reissued(reissued.gamertag)}
          </p>
          <QrCode value={reissued.qrUrl} label={VISITORS_COPY.qr.label(reissued.gamertag)} className="max-w-60" />
          <code className="font-mono text-sm break-all select-all">{reissued.qrUrl}</code>
        </div>
      ) : null}
    </div>
  );
}
