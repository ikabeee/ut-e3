"use client";

import { useRef, useTransition } from "react";
import { FieldError, Form, Input, Label, TextField, toast } from "@heroui/react";
import { addMemberByLeaderAction, deleteMemberByLeaderAction } from "@features/teams/lib/team-portal-actions";
import { STUDENT_GROUPS, type TeamPortalMember } from "@features/teams/lib/types";
import { ActionButton } from "@shared/components/action-button";
import { PaperCard } from "@shared/components/paper-card";
import { useServerActionForm } from "@shared/hooks/use-server-action-form";

interface TeamMemberManagerProps {
  members: TeamPortalMember[];
}

export function TeamMemberManager({ members }: Readonly<TeamMemberManagerProps>) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const form = useServerActionForm(addMemberByLeaderAction, () => {
    formRef.current?.reset();
    toast.success("Integrante registrado exitosamente.");
  });

  const handleDelete = (memberId: string) => {
    startDeleteTransition(async () => {
      try {
        const res = await deleteMemberByLeaderAction(memberId);

        if (!res.ok) {
          toast.danger(res.error);
        } else {
          toast.success("Integrante eliminado exitosamente.");
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error al eliminar integrante.";
        toast.danger(message);
      }
    });
  };

  return (
    <PaperCard className="gap-6 p-6">
      <div>
        <h3 className="font-wide text-lg font-bold tracking-[-.02em] uppercase">Integrantes del Equipo</h3>
        <p className="mt-1 text-xs text-paper-foreground/70">
          Registra a tus compañeros de equipo para que figuren en la ficha pública del juego.
        </p>
      </div>

      {/* Lista de integrantes actuales */}
      <div className="divide-y divide-paper-foreground/15 border-b border-paper-foreground/15 pb-4">
        {members.length === 0 ? (
          <p className="py-2 text-sm text-paper-foreground/60">Aún no hay integrantes registrados.</p>
        ) : null}
        {members.map((member) => (
          <div key={member.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div>
              <p className="font-semibold text-paper-foreground">
                {member.fullName}
                {member.isLeader ? (
                  <span className="text-primary ml-2 text-xs font-bold uppercase">(Líder)</span>
                ) : null}
              </p>
              <p className="text-xs text-paper-foreground/70">
                {member.email} · Grupo: {member.groupName}
              </p>
            </div>

            {!member.isLeader ? (
              <ActionButton
                variant="secondary"
                size="sm"
                isPending={isDeleting}
                onPress={() => handleDelete(member.id)}
              >
                Eliminar
              </ActionButton>
            ) : null}
          </div>
        ))}
      </div>

      {/* Formulario para agregar nuevo integrante */}
      <div>
        <h4 className="font-wide text-sm font-bold tracking-wider text-paper-foreground/90 uppercase">
          Agregar Nuevo Integrante
        </h4>
        <Form
          ref={formRef}
          onSubmit={form.submit}
          validationErrors={form.fieldErrors}
          className="mt-3 flex flex-col gap-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <TextField name="fullName" isRequired className="flex flex-col gap-1">
              <Label className="text-xs font-bold text-paper-foreground uppercase">Nombre Completo</Label>
              <Input placeholder="ej. Juan Pablo Hernández" onInput={form.clearFieldError} className="text-base" />
              <FieldError />
            </TextField>

            <div className="flex flex-col gap-1">
              <label htmlFor="group-select" className="text-xs font-bold text-paper-foreground uppercase">
                Grupo Estudiantil
              </label>
              <select
                id="group-select"
                name="groupName"
                required
                className="h-[42px] rounded border border-border bg-surface px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-accent focus:outline-none"
              >
                {STUDENT_GROUPS.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <ActionButton
            type="submit"
            variant="primary"
            isPending={form.isPending}
            className="mt-2 self-start font-bold uppercase"
          >
            {form.isPending ? "Guardando..." : "Agregar integrante"}
          </ActionButton>
        </Form>
      </div>
    </PaperCard>
  );
}
