"use client";

import { useCopyToClipboard } from "@features/event/hooks/use-copy-to-clipboard";
import { EVENT_COPY } from "@features/event/lib/event-copy";
import { ActionButton } from "@shared/components/action-button";

interface CopyAddressButtonProps {
  address: string;
}

/** "Copiar dirección": cambia su etiqueta según el resultado de la copia. */
export function CopyAddressButton({ address }: Readonly<CopyAddressButtonProps>) {
  const { copy, isCopied, hasFailed, isPending } = useCopyToClipboard();

  let label: string = EVENT_COPY.copyAddress.idle;

  if (isCopied) {
    label = EVENT_COPY.copyAddress.copied;
  } else if (hasFailed) {
    label = EVENT_COPY.copyAddress.failed;
  }

  return (
    <ActionButton variant="tertiary" size="lg" isPending={isPending} onPress={() => copy(address)}>
      {label}
    </ActionButton>
  );
}
