"use client";

import { Button, Input, Label, TextField } from "@heroui/react";
import { useSyncExternalStore } from "react";
import { SUPPORT_COPY } from "@features/support/lib/support-copy";
import { QrCodeImage } from "@shared/components/qr-code";
import { useCopyToClipboard } from "@shared/hooks/use-copy-to-clipboard";

const COPY = SUPPORT_COPY.recovery.result;

/**
 * The link that opens a passport on the visitor's phone, as a QR code to scan, a button to copy it and the text field
 * as a backup. The code is drawn in this page; the link does not go to any service.
 */
export function AccessHandoff({ claimPath }: Readonly<{ claimPath: string }>) {
  const origin = useSyncExternalStore(subscribeToNothing, readOrigin, readServerOrigin);
  const link = `${origin}${claimPath}`;

  return (
    <>
      {origin && <AccessQr link={link} />}
      <LinkField link={link} />
    </>
  );
}

function AccessQr({ link }: Readonly<{ link: string }>) {
  return (
    <div className="grid justify-items-center gap-2">
      <QrCodeImage value={link} label={COPY.qrLabel} className="w-full max-w-72 border border-border" />
      <p className="m-0 text-center text-sm text-muted">{COPY.qrHint}</p>
    </div>
  );
}

function LinkField({ link }: Readonly<{ link: string }>) {
  const { status, copy } = useCopyToClipboard(link);

  return (
    <div className="grid gap-2">
      <TextField isReadOnly>
        <Label>{COPY.linkLabel}</Label>
        <Input
          className="min-h-11 font-mono text-base"
          value={link}
          onFocus={(event) => event.currentTarget.select()}
          readOnly
        />
      </TextField>
      <Button variant="outline" className="min-h-11 justify-self-start" onPress={copy}>
        {COPY.copyLink[status]}
      </Button>
    </div>
  );
}

function subscribeToNothing(): () => void {
  return () => undefined;
}

function readOrigin(): string {
  return window.location.origin;
}

function readServerOrigin(): string {
  return "";
}
