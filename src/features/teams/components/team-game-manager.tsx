"use client";

import { FieldError, Form, Input, Label, TextArea, TextField, toast } from "@heroui/react";
import { createGameByLeaderAction, updateGameByLeaderAction } from "@features/teams/lib/team-portal-actions";
import { TEAMS_COPY } from "@features/teams/lib/teams-copy";
import type { TeamPortalGame } from "@features/teams/lib/types";
import { ActionButton } from "@shared/components/action-button";
import { PaperCard } from "@shared/components/paper-card";
import { useServerActionForm } from "@shared/hooks/use-server-action-form";

export interface TeamGameManagerProps {
  game: TeamPortalGame | null;
  createAction?: typeof createGameByLeaderAction;
  updateAction?: typeof updateGameByLeaderAction;
}

function TeamGameRegisterForm({
  action = createGameByLeaderAction,
}: Readonly<{ action?: typeof createGameByLeaderAction }>) {
  const copy = TEAMS_COPY.gameManager;

  const form = useServerActionForm(action, () => {
    toast.success(copy.registerSuccessToast);
  });

  return (
    <PaperCard className="gap-6 p-6">
      <div>
        <h3 className="font-wide text-lg font-bold tracking-[-.02em] uppercase">{copy.registerTitle}</h3>
        <p className="mt-1 text-xs text-paper-foreground/70">{copy.registerDescription}</p>
      </div>

      <Form onSubmit={form.submit} validationErrors={form.fieldErrors} className="flex flex-col gap-4">
        <TextField name="name" isRequired className="flex flex-col gap-1">
          <Label className="text-xs font-bold text-paper-foreground uppercase">{copy.nameLabel}</Label>
          <Input placeholder={copy.namePlaceholder} onInput={form.clearFieldError} className="text-base" />
          <FieldError />
        </TextField>

        <TextField name="description" isRequired className="flex flex-col gap-1">
          <Label className="text-xs font-bold text-paper-foreground uppercase">{copy.synopsisLabel}</Label>
          <TextArea
            placeholder={copy.synopsisPlaceholder}
            rows={4}
            onInput={form.clearFieldError}
            className="text-base"
          />
          <FieldError />
        </TextField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField name="players" type="number" defaultValue="1" className="flex flex-col gap-1">
            <Label className="text-xs font-bold text-paper-foreground uppercase">{copy.playersLabel}</Label>
            <Input min={1} max={16} onInput={form.clearFieldError} className="text-base" />
            <FieldError />
          </TextField>

          <TextField name="itchioUrl" type="url" className="flex flex-col gap-1">
            <Label className="text-xs font-bold text-paper-foreground uppercase">{copy.itchioLabel}</Label>
            <Input placeholder={copy.itchioPlaceholder} onInput={form.clearFieldError} className="text-base" />
            <FieldError />
          </TextField>
        </div>

        <ActionButton
          type="submit"
          variant="primary"
          isPending={form.isPending}
          className="mt-2 self-start font-bold uppercase"
        >
          {form.isPending ? copy.registeringButton : copy.registerButton}
        </ActionButton>
      </Form>
    </PaperCard>
  );
}

function TeamGameUpdateForm({
  game,
  action = updateGameByLeaderAction,
}: Readonly<{ game: TeamPortalGame; action?: typeof updateGameByLeaderAction }>) {
  const copy = TEAMS_COPY.gameManager;

  const form = useServerActionForm(action, () => {
    toast.success(copy.successToast);
  });

  return (
    <PaperCard className="gap-6 p-6">
      <div>
        <div className="flex items-center gap-3">
          <h3 className="font-wide text-lg font-bold tracking-[-.02em] uppercase">{copy.title}</h3>
          <span className="rounded bg-paper-foreground/10 px-2 py-0.5 text-xs font-bold uppercase">{game.name}</span>
        </div>
        <p className="mt-1 text-xs text-paper-foreground/70">{copy.description}</p>
      </div>

      <Form onSubmit={form.submit} validationErrors={form.fieldErrors} className="flex flex-col gap-4">
        <TextField name="description" isRequired defaultValue={game.description ?? ""} className="flex flex-col gap-1">
          <Label className="text-xs font-bold text-paper-foreground uppercase">{copy.synopsisLabel}</Label>
          <TextArea
            placeholder={copy.synopsisPlaceholder}
            rows={4}
            onInput={form.clearFieldError}
            className="text-base"
          />
          <FieldError />
        </TextField>

        <TextField name="itchioUrl" type="url" defaultValue={game.itchioUrl ?? ""} className="flex flex-col gap-1">
          <Label className="text-xs font-bold text-paper-foreground uppercase">{copy.itchioLabel}</Label>
          <Input placeholder={copy.itchioPlaceholder} onInput={form.clearFieldError} className="text-base" />
          <FieldError />
        </TextField>

        <ActionButton
          type="submit"
          variant="primary"
          isPending={form.isPending}
          className="mt-2 self-start font-bold uppercase"
        >
          {form.isPending ? copy.savingButton : copy.saveButton}
        </ActionButton>
      </Form>
    </PaperCard>
  );
}

export function TeamGameManager({ game, createAction, updateAction }: Readonly<TeamGameManagerProps>) {
  if (!game) {
    return <TeamGameRegisterForm action={createAction} />;
  }

  return <TeamGameUpdateForm game={game} action={updateAction} />;
}
