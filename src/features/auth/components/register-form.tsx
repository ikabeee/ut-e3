"use client";

import { useState } from "react";
import Link from "next/link";
import { Alert, Description, FieldError, Form, Input, Label, ListBox, Select, TextField } from "@heroui/react";
import { registerTeamAction } from "@features/auth/lib/auth-actions";
import { AUTH_COPY } from "@features/auth/lib/auth-copy";
import { LOGIN_PATH } from "@features/auth/lib/auth-links";
import { STUDENT_GROUPS } from "@features/auth/lib/auth-validation";
import { ActionButton } from "@shared/components/action-button";
import { PaperCard } from "@shared/components/paper-card";
import { useServerActionForm } from "@shared/hooks/use-server-action-form";

export function RegisterForm() {
  const copy = AUTH_COPY.register;
  const [isRegistered, setIsRegistered] = useState(false);

  const form = useServerActionForm(registerTeamAction, () => {
    setIsRegistered(true);
  });

  if (isRegistered) {
    return (
      <PaperCard className="w-full max-w-[560px] gap-6 p-[clamp(24px,4vw,36px)]">
        <div className="flex flex-col gap-3">
          <h1 className="font-wide text-2xl font-bold tracking-[-.03em] uppercase">{copy.successHeading}</h1>
          <Alert status="success">
            <Alert.Content>
              <Alert.Description>{copy.successMessage}</Alert.Description>
            </Alert.Content>
          </Alert>
        </div>
        <div className="pt-2">
          <Link
            href={LOGIN_PATH}
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-md px-5 py-2.5 font-semibold"
          >
            {copy.loginLink}
          </Link>
        </div>
      </PaperCard>
    );
  }

  return (
    <PaperCard className="w-full max-w-[560px] gap-6 p-[clamp(24px,4vw,36px)]">
      <div className="flex flex-col gap-2">
        <h1 className="font-wide text-2xl font-bold tracking-[-.03em] uppercase">{copy.heading}</h1>
        <p className="m-0 text-[15px] leading-[1.4] text-paper-foreground/80">{copy.subheading}</p>
      </div>

      <Form onSubmit={form.submit} validationErrors={form.fieldErrors} className="flex flex-col gap-4">
        <TextField name="teamName" isRequired className="flex flex-col gap-1">
          <Label className="text-paper-foreground">{copy.teamNameLabel}</Label>
          <Input placeholder={copy.teamNamePlaceholder} onInput={form.clearFieldError} className="text-base" />
          <Description className="text-paper-foreground/70">{copy.teamNameHint}</Description>
          <FieldError />
        </TextField>

        <TextField name="fullName" isRequired className="flex flex-col gap-1">
          <Label className="text-paper-foreground">{copy.leaderNameLabel}</Label>
          <Input
            placeholder={copy.leaderNamePlaceholder}
            onInput={form.clearFieldError}
            autoComplete="name"
            className="text-base"
          />
          <FieldError />
        </TextField>

        <div className="flex flex-col gap-1">
          <Select
            name="groupName"
            isRequired
            defaultValue={STUDENT_GROUPS[0]}
            placeholder="Selecciona grupo"
            className="flex flex-col gap-1"
          >
            <Label className="text-paper-foreground">{copy.groupLabel}</Label>
            <Select.Trigger className="min-h-11">
              <Select.Value className="text-base" />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {STUDENT_GROUPS.map((group) => (
                  <ListBox.Item key={group} id={group} textValue={group}>
                    {group}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
            <FieldError />
          </Select>
        </div>

        <TextField name="email" isRequired className="flex flex-col gap-1">
          <Label className="text-paper-foreground">{copy.emailLabel}</Label>
          <Input
            type="email"
            placeholder={copy.emailPlaceholder}
            onInput={form.clearFieldError}
            autoCapitalize="none"
            spellCheck={false}
            autoComplete="email"
            className="text-base"
          />
          <FieldError />
        </TextField>

        {form.error && Object.keys(form.fieldErrors).length === 0 ? (
          <p role="alert" className="m-0 text-sm font-medium text-danger">
            {form.error}
          </p>
        ) : null}

        <ActionButton type="submit" variant="primary" isPending={form.isPending} arrow="ne" className="mt-2">
          {form.isPending ? copy.submitting : copy.submitButton}
        </ActionButton>
      </Form>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-paper-foreground/15 pt-4 text-sm">
        <span className="text-paper-foreground/70">{copy.haveAccountPrompt}</span>
        <Link href={LOGIN_PATH} className="text-primary hover:text-primary/80 font-semibold underline">
          {copy.loginLink}
        </Link>
      </div>
    </PaperCard>
  );
}
