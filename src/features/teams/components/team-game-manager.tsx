import { FieldError, Form, Input, Label, TextArea, TextField, toast } from "@heroui/react";
import { updateGameByLeaderAction } from "@features/teams/lib/team-portal-actions";
import type { TeamPortalGame } from "@features/teams/lib/types";
import { ActionButton } from "@shared/components/action-button";
import { PaperCard } from "@shared/components/paper-card";
import { useServerActionForm } from "@shared/hooks/use-server-action-form";

interface TeamGameManagerProps {
  game: TeamPortalGame | null;
}

export function TeamGameManager({ game }: Readonly<TeamGameManagerProps>) {
  const form = useServerActionForm(updateGameByLeaderAction, () => {
    toast.success("Ficha del videojuego actualizada exitosamente.");
  });

  if (!game) {
    return (
      <PaperCard className="p-6">
        <h3 className="font-wide text-lg font-bold tracking-[-.02em] uppercase">Información del Videojuego</h3>
        <p className="mt-2 text-sm text-paper-foreground/70">
          Tu equipo aún no tiene un juego vinculado. Consulta con el administrador del evento para asignarlo.
        </p>
      </PaperCard>
    );
  }

  return (
    <PaperCard className="gap-6 p-6">
      <div>
        <div className="flex items-center gap-3">
          <h3 className="font-wide text-lg font-bold tracking-[-.02em] uppercase">Ficha del Videojuego</h3>
          <span className="rounded bg-paper-foreground/10 px-2 py-0.5 text-xs font-bold uppercase">{game.name}</span>
        </div>
        <p className="mt-1 text-xs text-paper-foreground/70">
          Edita la sinopsis y el enlace a la versión jugable que verán los visitantes en el catálogo del showcase.
        </p>
      </div>

      <Form onSubmit={form.submit} validationErrors={form.fieldErrors} className="flex flex-col gap-4">
        <TextField name="description" isRequired className="flex flex-col gap-1">
          <Label className="text-xs font-bold text-paper-foreground uppercase">Sinopsis / Descripción</Label>
          <TextArea
            defaultValue={game.description ?? ""}
            placeholder="Breve resumen de la premisa y mecánicas de tu juego..."
            rows={4}
            onInput={form.clearFieldError}
            className="text-base"
          />
          <FieldError />
        </TextField>

        <TextField name="itchioUrl" className="flex flex-col gap-1">
          <Label className="text-xs font-bold text-paper-foreground uppercase">Enlace a Itch.io (Opcional)</Label>
          <Input
            type="url"
            defaultValue={game.itchioUrl ?? ""}
            placeholder="https://tu-usuario.itch.io/tu-juego"
            onInput={form.clearFieldError}
            className="text-base"
          />
          <FieldError />
        </TextField>

        <ActionButton
          type="submit"
          variant="primary"
          isPending={form.isPending}
          className="mt-2 self-start font-bold uppercase"
        >
          {form.isPending ? "Guardando cambios..." : "Guardar ficha del juego"}
        </ActionButton>
      </Form>
    </PaperCard>
  );
}
