import { ActionLink } from "@shared/components/action-link";
import { AdminPanel } from "@features/admin/components/admin-panel";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { ADMIN_SECTION_PATHS } from "@features/admin/lib/admin-links";
import type { AdminSummary } from "@features/admin/lib/admin-records";

interface AdminSummaryListProps {
  summary: AdminSummary;
}

/** Resumen del panel: una tarjeta por sección con sus cantidades y un enlace. */
export function AdminSummaryList({ summary }: Readonly<AdminSummaryListProps>) {
  const copy = ADMIN_COPY.home;

  const sections = [
    { id: "teams", text: copy.teams(summary.teams, summary.teamsWithStand) },
    { id: "games", text: copy.games(summary.games, summary.visibleGames) },
    { id: "raffle", text: copy.winners(summary.winners) },
  ] as const;

  return (
    <div className="flex flex-col gap-[clamp(16px,2vw,24px)]">
      <p className="m-0 max-w-[68ch] text-muted">{copy.intro}</p>
      <div className="grid grid-cols-3 gap-[clamp(16px,2vw,24px)] max-[900px]:grid-cols-1">
        {sections.map((section) => (
          <AdminPanel key={section.id} title={ADMIN_COPY.nav.sections[section.id]}>
            <p className="m-0">{section.text}</p>
            <ActionLink href={ADMIN_SECTION_PATHS[section.id]} arrow="e" className="self-start">
              {copy.open}
            </ActionLink>
          </AdminPanel>
        ))}
      </div>
    </div>
  );
}
