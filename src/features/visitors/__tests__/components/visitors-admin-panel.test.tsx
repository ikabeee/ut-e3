import { render, screen, within } from "@testing-library/react";
import { VisitorsAdminPanel } from "@features/visitors/components/visitors-admin-panel";
import type { VisitorAdminActions } from "@features/visitors/components/visitor-row-actions";
import type { AdminVisitorRow } from "@features/visitors/lib/types";
import { VISITORS_ADMIN_COPY } from "@features/visitors/lib/visitors-admin-copy";

const COPY = VISITORS_ADMIN_COPY;

const action = async () => ({ status: "done" as const, message: "ok" });

const ACTIONS: VisitorAdminActions = { resend: action, recovery: action, update: action, unexclude: action };

const ROW: AdminVisitorRow = {
  id: "v1",
  gamertag: "Alpha",
  fullName: "Ana Lopez",
  email: "ana@ut.mx",
  createdAt: "2026-11-20T15:00:00.000Z",
  visitCount: 3,
  activeTickets: 1,
  tournamentStatus: "registered",
  isExcluded: false,
};

function renderPanel(overrides: { rows?: AdminVisitorRow[]; page?: number; pageCount?: number; query?: string } = {}) {
  const { rows = [ROW], page = 1, pageCount = 1, query = "" } = overrides;

  return render(
    <VisitorsAdminPanel
      basePath="/admin/visitors"
      params={{ query, page, sort: "oldest" }}
      page={{ rows, total: rows.length, page, pageCount }}
      perDay={[{ day: "2026-11-20", count: 7 }]}
      actions={ACTIONS}
    />,
  );
}

describe("VisitorsAdminPanel", () => {
  it("shows the columns of a registration, the KOF status and the count per day", () => {
    renderPanel();

    const card = screen.getByRole("article", { name: "Alpha" });

    expect(within(card).getByText("Ana Lopez")).toBeInTheDocument();
    expect(within(card).getByText("ana@ut.mx")).toBeInTheDocument();
    expect(within(card).getByText(COPY.list.kofStatus.registered)).toBeInTheDocument();
    expect(within(card).getByText(COPY.list.active)).toBeInTheDocument();
    expect(screen.getByText(COPY.perDay.row("2026-11-20", 7))).toBeInTheDocument();
  });

  it("offers to remove the exclusion only on an excluded passport", () => {
    const { rerender } = renderPanel();

    expect(screen.queryByRole("button", { name: COPY.actions.unexclude })).not.toBeInTheDocument();

    rerender(
      <VisitorsAdminPanel
        basePath="/admin/visitors"
        params={{ query: "", page: 1, sort: "newest" }}
        page={{ rows: [{ ...ROW, isExcluded: true }], total: 1, page: 1, pageCount: 1 }}
        perDay={[]}
        actions={ACTIONS}
      />,
    );

    expect(screen.getByRole("button", { name: COPY.actions.unexclude })).toBeInTheDocument();
    expect(screen.getByText(COPY.list.excluded)).toBeInTheDocument();
  });

  it("exports with the same search and sort, and pages keep them", () => {
    renderPanel({ query: "ana", page: 2, pageCount: 3 });

    expect(screen.getByRole("link", { name: COPY.list.exportCsv })).toHaveAttribute(
      "href",
      "/api/admin/visitors/export?q=ana&sort=oldest",
    );
    expect(screen.getByRole("link", { name: COPY.list.previous })).toHaveAttribute(
      "href",
      "/admin/visitors?q=ana&sort=oldest",
    );
    expect(screen.getByRole("link", { name: COPY.list.next })).toHaveAttribute(
      "href",
      "/admin/visitors?q=ana&sort=oldest&page=3",
    );
  });

  it("says so when nothing matches", () => {
    renderPanel({ rows: [], pageCount: 0 });

    expect(screen.getByText(COPY.list.empty)).toBeInTheDocument();
  });
});
