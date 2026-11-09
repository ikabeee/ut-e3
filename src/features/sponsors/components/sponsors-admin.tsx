"use client";

import { Description, FieldError, Form, Input, Label, TextArea, TextField } from "@heroui/react";
import { NAME_MAX_LENGTH, SERVICES_MAX_LENGTH } from "@features/sponsors/lib/sponsor-input";
import type { SponsorActionState } from "@features/sponsors/lib/sponsors-admin-actions";
import { SPONSORS_COPY } from "@features/sponsors/lib/sponsors-copy";
import type { Sponsor } from "@features/sponsors/lib/types";
import { ConfirmActionForm } from "@shared/components/confirm-action-form";
import { ActionFormFooter } from "@shared/components/action-form-footer";
import { useActionForm } from "@shared/hooks/use-action-form";

type SponsorAction = (previous: SponsorActionState | null, form: FormData) => Promise<SponsorActionState>;

interface SponsorsAdminProps {
  sponsors: readonly Sponsor[];
  saveAction: SponsorAction;
  deleteAction: SponsorAction;
}

const COPY = SPONSORS_COPY.admin;

const TEXT_FIELDS = [
  { name: "name", maxLength: NAME_MAX_LENGTH, type: "text", hint: null, isRequired: true },
  { name: "logoPath", maxLength: 200, type: "text", hint: COPY.hints.logoPath, isRequired: true },
  { name: "websiteUrl", maxLength: 300, type: "url", hint: null, isRequired: false },
  { name: "phone", maxLength: 20, type: "tel", hint: COPY.hints.phone, isRequired: false },
] as const;

/** Registers, edits and deletes the sponsors of the public cards (RF-41). */
export function SponsorsAdmin({ sponsors, saveAction, deleteAction }: Readonly<SponsorsAdminProps>) {
  return (
    <section aria-labelledby="sponsors-admin-heading" className="grid gap-6">
      <div className="grid gap-2">
        <h2 id="sponsors-admin-heading" className="type-section">
          {COPY.heading}
        </h2>
        <p className="text-sm text-muted">{COPY.lead}</p>
      </div>
      <details className="border border-border p-4">
        <summary className="min-h-11 cursor-pointer content-center type-mono">{COPY.newSponsor}</summary>
        <div className="pt-4">
          <SponsorForm action={saveAction} nextPosition={sponsors.length + 1} />
        </div>
      </details>
      {sponsors.length === 0 ? <p className="text-sm text-muted">{COPY.empty}</p> : null}
      <ul className="m-0 grid list-none gap-3 p-0" data-testid="sponsors-admin">
        {sponsors.map((sponsor) => (
          <li key={sponsor.id}>
            <details className="border border-border p-4">
              <summary className="min-h-11 cursor-pointer content-center">
                <span className="type-mono">{sponsor.position}.</span> {sponsor.name}
              </summary>
              <div className="grid gap-6 pt-4">
                <SponsorForm sponsor={sponsor} action={saveAction} nextPosition={sponsor.position} />
                <SponsorDelete sponsor={sponsor} action={deleteAction} />
              </div>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SponsorForm({
  sponsor,
  action,
  nextPosition,
}: Readonly<{ sponsor?: Sponsor; action: SponsorAction; nextPosition: number }>) {
  const { state, formAction, isPending, formRef, handleSubmit } = useActionForm(action, { resetOnDone: !sponsor });

  return (
    <Form
      ref={formRef}
      action={formAction}
      onSubmit={handleSubmit}
      validationErrors={state?.status === "error" ? state.errors : undefined}
      className="grid gap-5 min-[561px]:grid-cols-2"
    >
      {sponsor ? <input type="hidden" name="id" value={sponsor.id} /> : null}
      <SponsorTextFields sponsor={sponsor} />
      <SponsorExtraFields sponsor={sponsor} nextPosition={nextPosition} />
      <div className="grid gap-3 min-[561px]:col-span-2">
        <ActionFormFooter
          state={state}
          isPending={isPending}
          copy={{ submit: sponsor ? COPY.update : COPY.create, pending: COPY.pending }}
        />
      </div>
    </Form>
  );
}

function SponsorTextFields({ sponsor }: Readonly<{ sponsor?: Sponsor }>) {
  return TEXT_FIELDS.map((field) => (
    <TextField
      key={field.name}
      name={field.name}
      type={field.type}
      defaultValue={sponsor?.[field.name]}
      maxLength={field.maxLength}
      isRequired={field.isRequired}
    >
      <Label>{COPY.fields[field.name]}</Label>
      <Input className="min-h-11 text-base" />
      {field.hint ? <Description>{field.hint}</Description> : null}
      <FieldError />
    </TextField>
  ));
}

function SponsorExtraFields({ sponsor, nextPosition }: Readonly<{ sponsor?: Sponsor; nextPosition: number }>) {
  return (
    <>
      <TextField name="services" defaultValue={sponsor?.services} maxLength={SERVICES_MAX_LENGTH}>
        <Label>{COPY.fields.services}</Label>
        <TextArea className="text-base" rows={2} />
        <FieldError />
      </TextField>
      <TextField name="position" type="number" defaultValue={String(nextPosition)} isRequired>
        <Label>{COPY.fields.position}</Label>
        <Input className="min-h-11 text-base" min={1} max={999} step={1} />
        <Description>{COPY.hints.position}</Description>
        <FieldError />
      </TextField>
    </>
  );
}

function SponsorDelete({ sponsor, action }: Readonly<{ sponsor: Sponsor; action: SponsorAction }>) {
  return (
    <ConfirmActionForm
      action={action}
      field={{ name: "id", value: sponsor.id }}
      labels={{
        trigger: COPY.delete,
        prompt: COPY.confirmDelete(sponsor.name),
        confirm: COPY.confirmDeleteAction,
        cancel: COPY.cancel,
      }}
    />
  );
}
