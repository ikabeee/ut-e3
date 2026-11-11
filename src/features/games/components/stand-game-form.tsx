"use client";

import { Button, Description, FieldError, Form, Input, Label, TextArea, TextField } from "@heroui/react";
import { OptionSelect } from "@features/accounts/components/invite-account-form";
import { GAME_NAME_MAX_LENGTH, GAME_SYNOPSIS_MAX_LENGTH } from "@features/games/lib/game-input";
import { GAMES_COPY } from "@features/games/lib/games-copy";
import type { StandGameActionState } from "@features/games/lib/stand-game-actions";
import type { Genre, StandGame } from "@features/games/lib/types";
import { FormFeedback } from "@shared/components/form-feedback";
import { useActionForm } from "@shared/hooks/use-action-form";

export type StandGameAction = (previous: StandGameActionState | null, form: FormData) => Promise<StandGameActionState>;

interface StandGameFormProps {
  /** The registered game, or `null` while the stand has none. */
  game: StandGame | null;
  genres: readonly Genre[];
  action: StandGameAction;
}

const COPY = GAMES_COPY.standGame;

/** The data of the game of the stand (RF-31). There is no field for images or for the stand: neither is the form's. */
export function StandGameForm({ game, genres, action }: Readonly<StandGameFormProps>) {
  const { state, formAction, isPending, formRef, handleSubmit } = useActionForm(action, { resetOnDone: false });
  const genreOptions = genres.map((genre) => ({ value: genre.id, label: genre.name }));

  return (
    <Form ref={formRef} action={formAction} onSubmit={handleSubmit} className="grid max-w-2xl gap-5">
      <TextField name="name" defaultValue={game?.name} maxLength={GAME_NAME_MAX_LENGTH} autoComplete="off" isRequired>
        <Label>{COPY.fields.name}</Label>
        <Input className="min-h-11 text-base" />
        <FieldError />
      </TextField>
      <TextField name="synopsis" defaultValue={game?.synopsis} maxLength={GAME_SYNOPSIS_MAX_LENGTH} isRequired>
        <Label>{COPY.fields.synopsis}</Label>
        <TextArea className="text-base" rows={4} />
        <FieldError />
      </TextField>
      <OptionSelect name="genreId" label={COPY.fields.genre} options={genreOptions} defaultValue={game?.genreId} />
      <TextField name="itchUrl" type="url" defaultValue={game?.itchUrl ?? ""} autoComplete="off">
        <Label>{COPY.fields.itchUrl}</Label>
        <Input className="min-h-11 text-base" />
        <Description>{COPY.itchHint}</Description>
        <FieldError />
      </TextField>
      <p className="type-tiny text-muted">{COPY.coverNote}</p>
      <FormFeedback state={state} />
      <Button type="submit" variant="primary" className="min-h-11 justify-self-start" isPending={isPending}>
        {isPending ? COPY.pending : COPY.submit}
      </Button>
    </Form>
  );
}
