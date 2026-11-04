"use client";

import { Button } from "@heroui/react";
import { useFormStatus } from "react-dom";
import { useRecoveryLinkToken } from "@features/visitors/hooks/use-recovery-link-token";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";

interface RecoveryConfirmFormProps {
  action: (form: FormData) => Promise<void>;
}

const COPY = VISITORS_COPY.recovery;

// The link is spent only by this tap, not by opening it: mail scanners that follow links leave it unused.
export function RecoveryConfirmForm({ action }: Readonly<RecoveryConfirmFormProps>) {
  const token = useRecoveryLinkToken();

  if (token === "") {
    return (
      <p role="alert" className="text-center text-sm text-danger">
        {COPY.confirmMissing}
      </p>
    );
  }

  return (
    <form action={action} className="flex w-full max-w-sm flex-col gap-5">
      <input type="hidden" name="token" value={token ?? ""} />
      <ConfirmButton isDisabled={token === null} />
    </form>
  );
}

function ConfirmButton({ isDisabled }: Readonly<{ isDisabled: boolean }>) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="primary" className="min-h-11" isDisabled={isDisabled} isPending={pending}>
      {pending ? COPY.confirmPending : COPY.confirmSubmit}
    </Button>
  );
}
