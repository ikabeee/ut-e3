"use client";

import { useRef, useState, type ReactNode, type SyntheticEvent } from "react";
import { cn, Form, toast } from "@heroui/react";
import { ActionButton } from "@shared/components/action-button";
import { useServerActionForm } from "@shared/hooks/use-server-action-form";
import type { FormAction } from "@shared/lib/action-result";

interface AdminActionFormProps<T> {
  /** Server Action que recibe los campos del formulario (puede venir con `.bind(null, id)`). */
  action: FormAction<T>;
  submitLabel: string;
  /** Mensaje que se muestra cuando la acción termina bien. */
  successMessage?: string;
  /** Vacía los campos al terminar (formularios de alta). */
  resetOnSuccess?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Formulario del panel: envía sus campos a una Server Action de administración y muestra los
 * errores por campo (`validationErrors` de HeroUI), el error general o el mensaje de éxito. La
 * acción vuelve a renderizar la página, así que las listas se actualizan solas.
 */
export function AdminActionForm<T>({
  action,
  submitLabel,
  successMessage,
  resetOnSuccess = false,
  children,
  className,
}: Readonly<AdminActionFormProps<T>>) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  const form = useServerActionForm(action, () => {
    setSucceeded(true);

    if (successMessage) toast.success(successMessage);

    if (resetOnSuccess) formRef.current?.reset();
  });

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    formRef.current = event.currentTarget;
    setSucceeded(false);
    form.submit(event);
  };

  return (
    <Form onSubmit={submit} validationErrors={form.fieldErrors} className={cn("flex flex-col gap-4", className)}>
      {/* El `Form` de HeroUI no acepta `onInput`: se escucha aquí, sin alterar el acomodo. */}
      <div className="contents" onInput={form.clearFieldError}>
        {children}
      </div>
      {form.error ? (
        <p role="alert" className="m-0 text-sm text-danger">
          {form.error}
        </p>
      ) : null}
      {successMessage && succeeded && !form.isPending ? (
        <p role="status" className="m-0 text-sm text-success">
          {successMessage}
        </p>
      ) : null}
      <ActionButton type="submit" variant="primary" isPending={form.isPending} className="self-start">
        {submitLabel}
      </ActionButton>
    </Form>
  );
}
