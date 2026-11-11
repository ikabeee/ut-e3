import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { createRouter, withRouter } from "@features/pwa/__tests__/components/router-test-utils";
import { PassportView } from "@features/visitors/pages/passport-page";

const PASSPORT = { gamertag: "Neo", pin: "04217" };

const VISITS = { visitCount: 0, stands: [], tickets: [] };

describe("PassportView", () => {
  it("shows the gamertag and the PIN", () => {
    renderView(<PassportView passport={PASSPORT} visits={VISITS} />);

    expect(screen.getByText("Neo")).toBeInTheDocument();
    expect(screen.getByText("04217")).toBeInTheDocument();
  });

  it("shows what the page composes under the card, such as the tournament notice", () => {
    renderView(<PassportView passport={PASSPORT} visits={VISITS} extra={<p>Aviso del torneo</p>} />);

    expect(screen.getByText("Aviso del torneo")).toBeInTheDocument();
  });

  it("shows nothing extra when the page has nothing to add", () => {
    renderView(<PassportView passport={PASSPORT} visits={VISITS} />);

    expect(screen.queryByText("Aviso del torneo")).not.toBeInTheDocument();
  });
});

// The passport shows the state of the connection, which refreshes the data through the router of the App Router.
function renderView(view: ReactNode) {
  return render(
    withRouter(
      createRouter(() => undefined),
      view,
    ),
  );
}
