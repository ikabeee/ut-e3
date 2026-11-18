import { FieldError, Input, Label, TextField } from "@heroui/react";

interface EmailFieldProps {
  label: string;
}

/** The required email field of the sign-in and the password reset forms. */
export function EmailField({ label }: Readonly<EmailFieldProps>) {
  return (
    <TextField name="email" type="email" autoComplete="username" isRequired>
      <Label>{label}</Label>
      <Input className="min-h-11 text-base" />
      <FieldError />
    </TextField>
  );
}
