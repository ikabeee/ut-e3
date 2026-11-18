import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeGame } from "@features/games/__tests__/components/game-test-data";
import { createRouter, withRouter } from "@features/pwa/__tests__/components/router-test-utils";
import { PASSPORT_SNAPSHOT_KEY } from "@features/visitors/lib/passport-snapshot";
import { PassportView } from "@features/visitors/pages/passport-page";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";

describe("PassportView", () => {
  it("composes the PIN, the progress, the stands and the tickets of the visitor (RF-19 to RF-22)", () => {
    renderView();

    expect(screen.getByText("12345")).toBeInTheDocument();
    expect(screen.getByText(VISITORS_COPY.passport.progress.remaining(9))).toBeInTheDocument();
    // The map also shows the stand codes: the passport column is where the visits are.
    const passport = screen.getByRole("region", { name: VISITORS_COPY.passport.explorer.passportLabel });

    expect(within(passport).getByText("ZA-S2")).toBeInTheDocument();
    expect(screen.getByText(VISITORS_COPY.passport.tickets.ticket(3))).toBeInTheDocument();
  });

  it("shows whether the phone has a network and saves the passport in it for offline use (RNF-14)", () => {
    window.localStorage.clear();

    renderView();

    expect(screen.getByRole("status", { name: "Estado de la conexión" })).toHaveTextContent("En línea");
    expect(window.localStorage.getItem(PASSPORT_SNAPSHOT_KEY)).toContain("12345");
  });

  it("puts the map and the game detail beside the passport, and a stand tapped on it fills the detail (S18)", async () => {
    renderView();

    const passport = screen.getByRole("region", { name: VISITORS_COPY.passport.explorer.passportLabel });
    const detail = screen.getByRole("region", { name: VISITORS_COPY.passport.explorer.detailTitle });

    expect(within(passport).getByText("12345")).toBeInTheDocument();
    expect(detail).toHaveTextContent(VISITORS_COPY.passport.explorer.empty);

    await userEvent.click(screen.getByRole("button", { name: "Stand ZA-S2, Ceniza Protocol" }));

    expect(within(detail).getByRole("heading", { name: "Ceniza Protocol" })).toBeInTheDocument();
    expect(detail).toHaveTextContent(VISITORS_COPY.passport.stands.pending);
  });
});

function renderView() {
  return render(
    withRouter(
      createRouter(() => undefined),
      <PassportView
        passport={{ gamertag: "PlayerOne", pin: "12345" }}
        visits={{
          visitCount: 9,
          stands: [
            { code: "ZA-S1", visited: true, gameName: null },
            { code: "ZA-S2", visited: false, gameName: null },
          ],
          tickets: [{ number: 3, milestone: 9 }],
        }}
        games={[makeGame({ id: "ceniza-protocol", name: "Ceniza Protocol", stand: { zone: "A", number: 2 } })]}
      />,
    ),
  );
}
