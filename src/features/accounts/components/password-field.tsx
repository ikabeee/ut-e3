import { Description, FieldError, Input, Label, TextField } from "@heroui/react";

interface PasswordFieldProps {
  name: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  hint?: string;
}

/** A required password field of the account forms; `hint` says what a valid one looks like. */
export function PasswordField({ name, label, autoComplete, hint }: Readonly<PasswordFieldProps>) {
  return (
    <TextField name={name} type="password" autoComplete={autoComplete} isRequired>
      <Label>{label}</Label>
      <Input className="min-h-11 text-base" />
      {hint ? <Description>{hint}</Description> : null}
      <FieldError />
    </TextField>
  );
}
