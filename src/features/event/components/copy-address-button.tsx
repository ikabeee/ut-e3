"use client";

import { useCopyToClipboard } from "@features/event/hooks/use-copy-to-clipboard";
import { ActionButton } from "@shared/components/action-button";

interface CopyAddressButtonProps {
  address: string;
}

/** "Copiar dirección": cambia su etiqueta según el resultado de la copia. */
export function CopyAddressButton({ address }: Readonly<CopyAddressButtonProps>) {
  const { copy, isCopied, hasFailed, isPending } = useCopyToClipboard();

  let label = "Copiar dirección";
  if (isCopied) {
    label = "Dirección copiada";
  } else if (hasFailed) {
    label = "No se pudo copiar";
  }

  return (
    <ActionButton variant="tertiary" size="lg" isPending={isPending} onPress={() => copy(address)}>
      {label}
    </ActionButton>
  );
}
