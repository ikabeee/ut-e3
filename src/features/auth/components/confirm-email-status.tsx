import Link from "next/link";
import { Alert } from "@heroui/react";
import { AUTH_COPY } from "@features/auth/lib/auth-copy";
import { LOGIN_PATH, REGISTER_PATH } from "@features/auth/lib/auth-links";
import { PaperCard } from "@shared/components/paper-card";

interface ConfirmEmailStatusProps {
  isConfirmed: boolean;
}

export function ConfirmEmailStatus({ isConfirmed }: Readonly<ConfirmEmailStatusProps>) {
  const copy = AUTH_COPY.confirmEmail;

  return (
    <PaperCard className="w-full max-w-[500px] gap-6 p-[clamp(24px,4vw,36px)]">
      <div className="flex flex-col gap-2">
        <h1 className="font-wide text-2xl font-bold tracking-[-.03em] uppercase">
          {isConfirmed ? copy.successHeading : copy.errorHeading}
        </h1>
      </div>

      <Alert status={isConfirmed ? "success" : "danger"}>
        <Alert.Content>
          <Alert.Description>{isConfirmed ? copy.successMessage : copy.errorMessage}</Alert.Description>
        </Alert.Content>
      </Alert>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        {isConfirmed ? (
          <Link
            href={LOGIN_PATH}
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-md px-5 py-2.5 font-semibold"
          >
            {copy.goToLogin}
          </Link>
        ) : (
          <div className="flex gap-4">
            <Link
              href={LOGIN_PATH}
              className="bg-default-200 hover:bg-default-300 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-foreground"
            >
              {copy.goToLogin}
            </Link>
            <Link
              href={REGISTER_PATH}
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold"
            >
              {copy.retryRegister}
            </Link>
          </div>
        )}
      </div>
    </PaperCard>
  );
}
