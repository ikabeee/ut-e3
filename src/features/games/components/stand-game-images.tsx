"use client";

import { Form, Label } from "@heroui/react";
import Image from "next/image";
import { GENERIC_COVER_PATH } from "@features/games/lib/game-cover";
import { GAME_IMAGE_SLOTS, isScreenshotSlot, type GameImageSlot } from "@features/games/lib/game-image-slots";
import { GAMES_COPY } from "@features/games/lib/games-copy";
import type { StandGameActionState } from "@features/games/lib/stand-game-actions";
import type { GameImage } from "@features/games/lib/types";
import { ConfirmActionForm } from "@shared/components/confirm-action-form";
import { FormFeedback } from "@shared/components/form-feedback";
import { FormSubmit } from "@shared/components/form-submit";
import { useActionForm } from "@shared/hooks/use-action-form";

type ImageAction = (previous: StandGameActionState | null, form: FormData) => Promise<StandGameActionState>;

interface StandGameImagesProps {
  /** The game of the stand, or `null` while it has none: there is nothing to attach the images to. */
  game: { name: string; slug: string; images: readonly GameImage[] } | null;
  uploadAction: ImageAction;
  deleteAction: ImageAction;
}

const COPY = GAMES_COPY.standGame.images;

/** The checklist of the images that the grid of covers asks for, with what is loaded and a form for each slot. */
export function StandGameImages({ game, uploadAction, deleteAction }: Readonly<StandGameImagesProps>) {
  if (!game) return <p className="text-sm text-muted">{COPY.needsGame}</p>;

  const loaded = new Map(findLoadedImages(game.images).map((image) => [image.position, image]));
  const requiredSlots = GAME_IMAGE_SLOTS.filter((slot) => slot.isRequired);
  const doneCount = requiredSlots.filter((slot) => loaded.has(slot.position)).length;

  return (
    <section aria-labelledby="stand-game-images-heading" className="grid gap-5">
      <div className="grid gap-2">
        <h2 id="stand-game-images-heading" className="type-section">
          {COPY.heading}
        </h2>
        <p className="text-sm text-muted">{COPY.lead}</p>
        <p role="status" className="type-mono">
          {COPY.checklist(doneCount, requiredSlots.length)}
        </p>
      </div>
      <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2">
        {GAME_IMAGE_SLOTS.map((slot) => (
          <li key={slot.id} className="grid content-start gap-3 border border-border p-3">
            <SlotCard
              slot={slot}
              game={game}
              image={loaded.get(slot.position)}
              actions={{ uploadAction, deleteAction }}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

// The generic cover that a new game gets is not an image of the grid: the card slot still counts as missing.
function findLoadedImages(images: readonly GameImage[]): GameImage[] {
  return images.filter((image) => image.path !== GENERIC_COVER_PATH);
}

interface SlotCardProps {
  slot: GameImageSlot;
  game: { name: string; slug: string };
  image: GameImage | undefined;
  actions: { uploadAction: ImageAction; deleteAction: ImageAction };
}

function SlotCard({ slot, game, image, actions }: Readonly<SlotCardProps>) {
  const copy = describeSlot(slot);

  return (
    <>
      <p className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="type-mono">{copy.label}</span>
        <span className="type-tiny text-muted">
          {slot.isRequired ? COPY.required : COPY.optional} · {image ? COPY.filled : COPY.missing}
        </span>
      </p>
      <p className="type-tiny text-muted">{copy.hint}</p>
      <p className="type-tiny text-muted">
        {COPY.fileName(game.slug, slot.fileSuffix)} · {COPY.requirement(slot.width, slot.height)}
      </p>
      {image ? <SlotPreview slot={slot} image={image} label={COPY.previewAlt(copy.label, game.name)} /> : null}
      <UploadForm slot={slot} hasImage={Boolean(image)} action={actions.uploadAction} />
      {image && isScreenshotSlot(slot) ? (
        <ConfirmActionForm
          action={actions.deleteAction}
          field={{ name: "slot", value: slot.id }}
          labels={{
            trigger: COPY.remove,
            prompt: COPY.confirmRemove(copy.label),
            confirm: COPY.confirmRemoveAction,
            cancel: COPY.cancel,
          }}
        />
      ) : null}
    </>
  );
}

function SlotPreview({ slot, image, label }: Readonly<{ slot: GameImageSlot; image: GameImage; label: string }>) {
  return (
    <Image
      src={image.path}
      alt={label}
      width={slot.width / 4}
      height={slot.height / 4}
      sizes="(min-width: 640px) 300px, 90vw"
      className="h-auto w-full max-w-xs border border-border"
    />
  );
}

function UploadForm({
  slot,
  hasImage,
  action,
}: Readonly<{ slot: GameImageSlot; hasImage: boolean; action: ImageAction }>) {
  const { state, formAction, isPending, formRef, handleSubmit } = useActionForm(action);
  const inputId = `game-image-${slot.id}`;

  return (
    <Form ref={formRef} action={formAction} onSubmit={handleSubmit} className="grid gap-3">
      <input type="hidden" name="slot" value={slot.id} />
      <div className="grid gap-1">
        <Label htmlFor={inputId}>{COPY.choose}</Label>
        <input
          id={inputId}
          name="file"
          type="file"
          accept="image/jpeg"
          required
          className="min-h-11 border border-border p-2 text-base"
        />
      </div>
      <FormSubmit
        error={state?.status === "error" ? state.message : null}
        isPending={isPending}
        copy={{ submit: hasImage ? COPY.replace : COPY.upload, pending: COPY.uploading }}
      />
      <FormFeedback state={state?.status === "done" ? state : null} />
    </Form>
  );
}

function describeSlot(slot: GameImageSlot): { label: string; hint: string } {
  if (slot.id === "card") return COPY.slots.card;

  if (slot.id === "landscape") return COPY.slots.landscape;

  return COPY.slots.screenshot(slot.position - 2);
}
