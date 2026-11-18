"use client";

import { Button, Description, FieldError, InputGroup, Label, TextField } from "@heroui/react";
import { useState } from "react";
import { ACCOUNTS_COPY } from "@features/accounts/lib/accounts-copy";

interface PasswordFieldProps {
  name: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  hint?: string;
}

const COPY = ACCOUNTS_COPY.passwordVisibility;

/**
 * A required password field of the account forms; `hint` says what a valid one looks like. The eye button shows the
 * typed password so it can be checked before sending (S9); it is a plain button, so it never submits the form.
 */
export function PasswordField({ name, label, autoComplete, hint }: Readonly<PasswordFieldProps>) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <TextField name={name} type={isVisible ? "text" : "password"} autoComplete={autoComplete} isRequired>
      <Label>{label}</Label>
      <InputGroup>
        <InputGroup.Input className="min-h-11 text-base" />
        <InputGroup.Suffix className="pr-0">
          <Button
            variant="tertiary"
            isIconOnly
            aria-label={isVisible ? COPY.hide : COPY.show}
            className="size-11 min-w-11"
            onPress={() => setIsVisible((current) => !current)}
          >
            <EyeIcon isCrossedOut={isVisible} />
          </Button>
        </InputGroup.Suffix>
      </InputGroup>
      {hint ? <Description>{hint}</Description> : null}
      <FieldError />
    </TextField>
  );
}

// An open eye while the password is hidden (press to show it), crossed out while it is shown (press to hide it).
function EyeIcon({ isCrossedOut }: Readonly<{ isCrossedOut: boolean }>) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      {isCrossedOut ? <path d="m4 4 16 16" /> : null}
    </svg>
  );
}
