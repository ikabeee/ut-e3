"use client";

import { Button } from "@heroui/react";
import { useCopyToClipboard } from "@features/landing/hooks/use-copy-to-clipboard";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";
import { ScrambleText } from "@shared/components/scramble-text";

interface CopyAddressButtonProps {
  address: string;
}

export function CopyAddressButton({ address }: Readonly<CopyAddressButtonProps>) {
  const { status, copy } = useCopyToClipboard(address);

  return (
    <Button variant="tertiary" size="lg" onPress={copy}>
      <ScrambleText text={LANDING_COPY.venue.copyAddress[status]} />
    </Button>
  );
}
