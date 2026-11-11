import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { ADMIN_SETTINGS_PATH } from "@features/admin/lib/admin-links";
import { AdminSectionShell, buildAdminSectionMetadata } from "@features/admin/pages/admin-section-shell";
import { EventSettingsForm } from "@features/event-settings/components/event-settings-form";
import { saveEventSettingsAction } from "@features/event-settings/lib/event-settings-actions";
import { EVENT_SETTINGS_COPY } from "@features/event-settings/lib/event-settings-copy";
import { getEditableEventSettings } from "@features/event-settings/lib/server/event-settings-queries";

const PAGE = ADMIN_COPY.pages.settings;

const COPY = EVENT_SETTINGS_COPY.admin;

export const adminSettingsPageMetadata = buildAdminSectionMetadata(PAGE, ADMIN_SETTINGS_PATH);

export function AdminSettingsPage() {
  return <AdminSectionShell title={PAGE.title} path={ADMIN_SETTINGS_PATH} renderContent={renderSettings} />;
}

// The row as it is right now, so the form shows what the last save left (RF-43).
async function renderSettings() {
  const settings = await getEditableEventSettings();

  return (
    <section aria-labelledby="event-settings-heading" className="grid gap-6">
      <div className="grid gap-2">
        <h2 id="event-settings-heading" className="type-section">
          {COPY.heading}
        </h2>
        <p className="text-sm text-muted">{COPY.lead}</p>
      </div>
      <EventSettingsForm settings={settings} action={saveEventSettingsAction} />
    </section>
  );
}
