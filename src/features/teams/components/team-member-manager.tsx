"use client";

import { useRef, useTransition } from "react";
import { Persons } from "@gravity-ui/icons";
import { FieldError, Form, Input, Label, TextField, toast } from "@heroui/react";
import { addMemberByLeaderAction, deleteMemberByLeaderAction } from "@features/teams/lib/team-portal-actions";
import { TEAMS_COPY } from "@features/teams/lib/teams-copy";
import { STUDENT_GROUPS, type TeamPortalMember } from "@features/teams/lib/types";
import { ActionButton } from "@shared/components/action-button";
import { EmptyState } from "@shared/components/empty-state";
import { PaperCard } from "@shared/components/paper-card";
import { useServerActionForm } from "@shared/hooks/use-server-action-form";

interface TeamMemberManagerProps {
  members: TeamPortalMember[];
}

export function TeamMemberManager({ members }: Readonly<TeamMemberManagerProps>) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isDeleting, startDeleteTransition] = useTransition();
  const copy = TEAMS_COPY.memberManager;

  const form = useServerActionForm(addMemberByLeaderAction, () => {
    formRef.current?.reset();
    toast.success(copy.addSuccessToast);
  });

  const handleDelete = (memberId: string) => {
    startDeleteTransition(async () => {
      try {
        const res = await deleteMemberByLeaderAction(memberId);

        if (!res.ok) {
          toast.danger(res.error);
        } else {
          toast.success(copy.deleteSuccessToast);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : copy.deleteErrorFallback;
        toast.danger(message);
      }
    });
  };

  return (
    <PaperCard className="gap-6 p-6">
      <div>
        <h3 className="font-wide text-lg font-bold tracking-[-.02em] uppercase">{copy.title}</h3>
        <p className="mt-1 text-xs text-paper-foreground/70">{copy.description}</p>
      </div>

      {/* Lista de integrantes actuales */}
      <div className="divide-y divide-paper-foreground/15 border-b border-paper-foreground/15 pb-4">
        {members.length === 0 ? (
          <EmptyState
            icon={Persons}
            size="sm"
            title={copy.emptyTitle}
            className="my-2 border-paper-foreground/15 text-paper-foreground/70 [&_svg]:text-paper-foreground/50"
          />
        ) : null}
        {members.map((member) => (
          <div key={member.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div>
              <p className="font-semibold text-paper-foreground">
                {member.fullName}
                {member.isLeader ? (
                  <span className="text-primary ml-2 text-xs font-bold uppercase">{copy.leaderBadge}</span>
                ) : null}
              </p>
              <p className="text-xs text-paper-foreground/70">
                {member.email} · {copy.groupLabel}: {member.groupName}
              </p>
            </div>

            {!member.isLeader ? (
              <ActionButton
                variant="secondary"
                size="sm"
                isPending={isDeleting}
                onPress={() => handleDelete(member.id)}
              >
                {copy.deleteButton}
              </ActionButton>
            ) : null}
          </div>
        ))}
      </div>

      {/* Formulario para agregar nuevo integrante */}
      <div>
        <h4 className="font-wide text-sm font-bold tracking-wider text-paper-foreground/90 uppercase">
          {copy.addTitle}
        </h4>
        <Form
          ref={formRef}
          onSubmit={form.submit}
          validationErrors={form.fieldErrors}
          className="mt-3 flex flex-col gap-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <TextField name="fullName" isRequired className="flex flex-col gap-1">
              <Label className="text-xs font-bold text-paper-foreground uppercase">{copy.fullNameLabel}</Label>
              <Input placeholder={copy.fullNamePlaceholder} onInput={form.clearFieldError} className="text-base" />
              <FieldError />
            </TextField>

            <div className="flex flex-col gap-1">
              <label htmlFor="group-select" className="text-xs font-bold text-paper-foreground uppercase">
                {copy.studentGroupLabel}
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
            {form.isPending ? copy.savingButton : copy.saveButton}
          </ActionButton>
        </Form>
      </div>
    </PaperCard>
  );
}
