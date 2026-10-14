"use client";

import { useState, useTransition } from "react";
import { Button, toast } from "@heroui/react";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import type { ActionResult } from "@shared/lib/action-result";

interface AdminActionButtonProps {
  /** Server Action sin datos de formulario, normalmente con `.bind(null, id)`. */
  action: () => Promise<ActionResult<unknown>>;
  label: string;
  /** Si existe, pide confirmar antes de ejecutar (borrados y acciones que no se deshacen). */
  confirmLabel?: string;
  variant?: "primary" | "outline" | "tertiary" | "danger";
  /** Mensaje de confirmación en toast que se muestra si la acción termina con éxito. */
  successMessage?: string;
}

/** Botón del panel que ejecuta una acción (borrar, marcar portada, avisado...) y muestra su error. */
export function AdminActionButton({
  action,
  label,
  confirmLabel,
  variant = "outline",
  successMessage,
}: Readonly<AdminActionButtonProps>) {
  const [isPending, startTransition] = useTransition();
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    setIsConfirming(false);
    startTransition(async () => {
      try {
        const result = await action();

        if (result.ok) {
          setError(null);

          if (successMessage) {
            toast.success(successMessage);
          }
        } else {
          setError(result.error);
          toast.danger(result.error);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : ADMIN_COPY.common.unexpectedError;
        setError(message);
        toast.danger(message);
      }
    });
  };

  return (
    <div className="flex flex-col gap-1">
      {isConfirming ? (
        <div className="flex flex-wrap gap-2">
          <Button variant="danger" onPress={run} className="min-h-11">
            {confirmLabel}
          </Button>
          <Button variant="tertiary" onPress={() => setIsConfirming(false)} className="min-h-11">
            {ADMIN_COPY.common.cancel}
          </Button>
        </div>
      ) : (
        <Button
          variant={variant}
          isPending={isPending}
          onPress={() => (confirmLabel ? setIsConfirming(true) : run())}
          className="min-h-11 self-start"
        >
          {label}
        </Button>
      )}
      {error ? (
        <p role="alert" className="m-0 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
