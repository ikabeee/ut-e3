import { Description, FieldError, Input, Label, TextArea, TextField } from "@heroui/react";

interface AdminTextFieldProps {
  name: string;
  label: string;
  defaultValue?: string | number | null;
  description?: string;
  placeholder?: string;
  isRequired?: boolean;
  type?: "text" | "url" | "number" | "email" | "password";
  /** Área de texto de varias líneas (por ejemplo, "Acerca del juego"). */
  multiline?: boolean;
}

/**
 * Campo de texto del panel (TextField de HeroUI). Los errores que devuelve la acción llegan por
 * `name` desde el `Form`. Letra de 16 px para que iOS no haga zoom al escribir.
 */
export function AdminTextField({
  name,
  label,
  defaultValue,
  description,
  placeholder,
  isRequired = false,
  type = "text",
  multiline = false,
}: Readonly<AdminTextFieldProps>) {
  return (
    <TextField
      name={name}
      type={type}
      isRequired={isRequired}
      defaultValue={defaultValue === null || defaultValue === undefined ? undefined : String(defaultValue)}
      className="flex flex-col gap-1"
    >
      <Label>{label}</Label>
      {multiline ? (
        <TextArea placeholder={placeholder} rows={5} className="text-base" />
      ) : (
        <Input placeholder={placeholder} className="text-base" />
      )}
      {description ? <Description>{description}</Description> : null}
      <FieldError />
    </TextField>
  );
}
