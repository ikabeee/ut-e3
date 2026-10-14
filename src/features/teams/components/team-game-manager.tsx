import { Boxes3 } from "@gravity-ui/icons";
import { FieldError, Form, Input, Label, TextArea, TextField, toast } from "@heroui/react";
import { updateGameByLeaderAction } from "@features/teams/lib/team-portal-actions";
import { TEAMS_COPY } from "@features/teams/lib/teams-copy";
import type { TeamPortalGame } from "@features/teams/lib/types";
import { ActionButton } from "@shared/components/action-button";
import { EmptyState } from "@shared/components/empty-state";
import { PaperCard } from "@shared/components/paper-card";
import { useServerActionForm } from "@shared/hooks/use-server-action-form";

interface TeamGameManagerProps {
  game: TeamPortalGame | null;
}

export function TeamGameManager({ game }: Readonly<TeamGameManagerProps>) {
  const copy = TEAMS_COPY.gameManager;

  const form = useServerActionForm(updateGameByLeaderAction, () => {
    toast.success(copy.successToast);
  });

  if (!game) {
    return (
      <PaperCard className="p-6">
        <h3 className="font-wide text-lg font-bold tracking-[-.02em] uppercase">{copy.infoTitle}</h3>
        <EmptyState
          icon={Boxes3}
          size="sm"
          title={copy.emptyTitle}
          description={copy.emptyDescription}
          className="mt-4 border-paper-foreground/15 text-paper-foreground/70 [&_svg]:text-paper-foreground/50"
        />
      </PaperCard>
    );
  }

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
        <TextField name="description" isRequired className="flex flex-col gap-1">
          <Label className="text-xs font-bold text-paper-foreground uppercase">{copy.synopsisLabel}</Label>
          <TextArea
            defaultValue={game.description ?? ""}
            placeholder={copy.synopsisPlaceholder}
            rows={4}
            onInput={form.clearFieldError}
            className="text-base"
          />
          <FieldError />
        </TextField>

        <TextField name="itchioUrl" className="flex flex-col gap-1">
          <Label className="text-xs font-bold text-paper-foreground uppercase">{copy.itchioLabel}</Label>
          <Input
            type="url"
            defaultValue={game.itchioUrl ?? ""}
            placeholder={copy.itchioPlaceholder}
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
          {form.isPending ? copy.savingButton : copy.saveButton}
        </ActionButton>
      </Form>
    </PaperCard>
  );
}
