"use client";

import { Form, Input, Label, TextField } from "@heroui/react";
import { GAMES_COPY } from "@features/games/lib/games-copy";
import type { GenreActionState } from "@features/games/lib/genre-admin-actions";
import { GENRE_NAME_MAX_LENGTH, GENRE_NAME_MIN_LENGTH } from "@features/games/lib/genre-input";
import type { AdminGenre } from "@features/games/lib/types";
import { ConfirmActionForm } from "@shared/components/confirm-action-form";
import { FormFeedback } from "@shared/components/form-feedback";
import { FormSubmit } from "@shared/components/form-submit";
import { useActionForm } from "@shared/hooks/use-action-form";

type GenreAction = (previous: GenreActionState | null, form: FormData) => Promise<GenreActionState>;

interface GenresAdminProps {
  genres: readonly AdminGenre[];
  saveAction: GenreAction;
  deleteAction: GenreAction;
}

const COPY = GAMES_COPY.genresAdmin;

/** The catalog of genres (RF-72): add, rename, and delete only the ones without games. */
export function GenresAdmin({ genres, saveAction, deleteAction }: Readonly<GenresAdminProps>) {
  return (
    <section aria-labelledby="genres-admin-heading" className="grid gap-6">
      <div className="grid gap-2">
        <h2 id="genres-admin-heading" className="type-section">
          {COPY.heading}
        </h2>
        <p className="text-sm text-muted">{COPY.lead}</p>
      </div>
      <GenreForm action={saveAction} />
      {genres.length === 0 ? <p className="text-sm text-muted">{COPY.empty}</p> : null}
      <ul className="m-0 grid list-none gap-2 p-0" data-testid="genres-admin">
        {genres.map((genre) => (
          <li key={genre.id} className="grid gap-3 border border-border p-3">
            <p className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="type-mono">{genre.name}</span>
              <span className="type-tiny text-muted">{COPY.gameCount(genre.gameCount)}</span>
            </p>
            <GenreForm genre={genre} action={saveAction} />
            <ConfirmActionForm
              action={deleteAction}
              field={{ name: "id", value: genre.id }}
              labels={{
                trigger: COPY.delete,
                prompt: COPY.confirmDelete(genre.name),
                confirm: COPY.confirmDeleteAction,
                cancel: COPY.cancel,
              }}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function GenreForm({ genre, action }: Readonly<{ genre?: AdminGenre; action: GenreAction }>) {
  const { state, formAction, isPending, formRef, handleSubmit } = useActionForm(action, { resetOnDone: !genre });

  return (
    <Form ref={formRef} action={formAction} onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      {genre ? <input type="hidden" name="id" value={genre.id} /> : null}
      <TextField
        name="name"
        defaultValue={genre?.name}
        minLength={GENRE_NAME_MIN_LENGTH}
        maxLength={GENRE_NAME_MAX_LENGTH}
        isRequired
        className="max-w-xs grow"
      >
        <Label>{genre ? COPY.name : COPY.newGenre}</Label>
        <Input className="min-h-11 text-base" />
      </TextField>
      <FormSubmit
        error={state?.status === "error" ? state.message : null}
        isPending={isPending}
        copy={{ submit: genre ? COPY.rename : COPY.create, pending: COPY.pending }}
      />
      <FormFeedback state={state?.status === "done" ? state : null} />
    </Form>
  );
}
