import { Alert } from "@heroui/react";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";

interface ScannerKeyAlertProps {
  scannerKey: string;
}

/** Llave del escáner recién generada: sólo se ve una vez. */
export function ScannerKeyAlert({ scannerKey }: Readonly<ScannerKeyAlertProps>) {
  return (
    <Alert status="warning">
      <Alert.Content>
        <Alert.Title>{ADMIN_COPY.teams.scannerKeyTitle}</Alert.Title>
        <Alert.Description>
          <code className="block font-mono text-base break-all select-all">{scannerKey}</code>
          {ADMIN_COPY.teams.scannerKeyHint}
        </Alert.Description>
      </Alert.Content>
    </Alert>
  );
}
