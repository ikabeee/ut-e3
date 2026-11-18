import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { AccountsPanel } from "@features/accounts/components/accounts-panel";
import { signOut } from "@features/accounts/lib/accounts-actions";
import { KOF_HOME_PATH } from "@features/accounts/lib/accounts-links";
import { ACCOUNT_ACTIONS } from "@features/accounts/lib/management-action-set";
import { requireKofViewer, type KofViewer } from "@features/accounts/lib/server/current-account";
import { listManagedAccounts } from "@features/accounts/lib/server/invitations";
import { AdminHeader } from "@features/admin/components/admin-header";
import { EntriesPanel } from "@features/tournament/components/entries-panel";
import { ParticipantsMonitor } from "@features/tournament/components/participants-monitor";
import { PublicBracketSwitch } from "@features/tournament/components/public-bracket-switch";
import { TournamentDashboard } from "@features/tournament/components/tournament-dashboard";
import {
  addEntryAction,
  checkInEntryAction,
  generateBracketAction,
  resetBracketAction,
} from "@features/tournament/lib/entries-actions";
import { setPublicBracketAction } from "@features/tournament/lib/public-bracket-actions";
import { submitTournamentCommand } from "@features/tournament/lib/tournament-actions";
import { TOURNAMENT_COPY } from "@features/tournament/lib/tournament-copy";
import { canViewEntries } from "@features/tournament/lib/tournament-rules";
import { closeCheckInIfDue } from "@features/tournament/lib/server/entries-mutations";
import { getEntries } from "@features/tournament/lib/server/entries-queries";
import { getPublicBracketEnabled } from "@features/tournament/lib/server/public-bracket-queries";
import { getTournament } from "@features/tournament/lib/server/tournament-queries";

const COPY = TOURNAMENT_COPY.ui;

export const kofPageMetadata: Metadata = {
  title: COPY.title,
  description: COPY.description,
  alternates: { canonical: KOF_HOME_PATH },
  robots: { index: false, follow: false },
};

// The same frame as the other sections of the panel (S11): the sysadmin also gets the navigation between sections.
export function KofPage() {
  return (
    <main className="page-wrap grid gap-12 py-12">
      <Suspense fallback={<p className="type-mono text-muted">{COPY.loading}</p>}>
        <KofPanel />
      </Suspense>
    </main>
  );
}

// Reads the session cookie and the live bracket, so it streams behind the Suspense boundary. connection() goes first:
// the session check reads the clock, which Cache Components only allows once the page is known to be dynamic.
async function KofPanel() {
  await connection();

  const account = await requireKofViewer();
  const tournament = await getTournament();

  return (
    <>
      <AdminHeader
        title={COPY.title}
        signedInAs={COPY.signedInAs(account.name, getRoleLabel(account))}
        currentPath={account.role === "sysadmin" ? KOF_HOME_PATH : null}
        signOutAction={signOut}
      />
      <Entries viewer={account} hasBracket={tournament !== null} />
      {account.role === "kof_admin" && <PublicBracketPanel />}
      {account.role === "kof_admin" && <StaffAccounts role={account.role} />}
      <TournamentDashboard
        initial={tournament}
        viewer={{ role: account.role, desk: account.kofDesk }}
        action={submitTournamentCommand}
      />
    </>
  );
}

function getRoleLabel(account: KofViewer): string {
  if (account.role === "sysadmin") return COPY.roles.sysadmin;

  return account.role === "kof_admin" ? COPY.roles.kof_admin : COPY.roles.kof_staff(account.kofDesk);
}

// The participants are for the sysadmin and the KOF administrator only (S26); the desks see just the bracket.
function Entries({ viewer, hasBracket }: Readonly<{ viewer: KofViewer; hasBracket: boolean }>) {
  if (!canViewEntries(viewer.role)) return null;

  if (viewer.role === "kof_admin") return <AdminEntries adminId={viewer.id} hasBracket={hasBracket} />;

  return <WatchedEntries hasBracket={hasBracket} />;
}

const ENTRIES_ACTIONS = {
  add: addEntryAction,
  checkIn: checkInEntryAction,
  generate: generateBracketAction,
  reset: resetBracketAction,
};

// The administrator works the list. Loading it first closes the check-in if its hour passed, so the list never shows a
// pre-registered player as waiting after 12:45.
async function AdminEntries({ adminId, hasBracket }: Readonly<{ adminId: string; hasBracket: boolean }>) {
  return <EntriesPanel entries={await loadEntries(adminId)} hasBracket={hasBracket} actions={ENTRIES_ACTIONS} />;
}

async function loadEntries(adminId: string) {
  await closeCheckInIfDue(adminId, new Date());

  return getEntries();
}

// The sysadmin sees the same list, read-only and refreshed on its own (S26). It only reads: the check-in closes when the
// administrator works the list, never because the sysadmin looked at it.
async function WatchedEntries({ hasBracket }: Readonly<{ hasBracket: boolean }>) {
  return <ParticipantsMonitor initial={await getEntries()} hasBracket={hasBracket} />;
}

// The administrator invites, resends and disables the staff of the two desks (the roles table of the SRS).
async function StaffAccounts({ role }: Readonly<{ role: string }>) {
  return (
    <AccountsPanel
      heading={COPY.staffHeading}
      actorRole={role}
      accounts={await listManagedAccounts(role)}
      actions={ACCOUNT_ACTIONS}
    />
  );
}

// Closing the public bracket never touches the operation of the tournament: the desks keep their access (RF-74).
async function PublicBracketPanel() {
  return <PublicBracketSwitch isEnabled={await getPublicBracketEnabled()} action={setPublicBracketAction} />;
}
