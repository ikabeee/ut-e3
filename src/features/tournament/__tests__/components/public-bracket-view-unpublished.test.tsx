import { render, screen } from "@testing-library/react";
import { PublicBracketView } from "@features/tournament/components/public-bracket-view";
import { toPublicBracket } from "@features/tournament/lib/public-bracket";
import { createTestTournament } from "@features/tournament/__tests__/tournament-test-utils";

// Instants from event_settings; America/Cancun renders them as 10:00, 11:00 and 12:00.
const CHECK_IN_STARTS_AT = "2026-11-20T15:00:00.000Z";

const CHECK_IN_ENDS_AT = "2026-11-20T16:00:00.000Z";

const BRACKET_GENERATES_AT = "2026-11-20T17:00:00.000Z";

// Built by the page: getZoneLink("kof") prefixed with the landing path, and the schedule section of the landing.
const KOF_LINK = { href: "/#floor-plan-kof", label: "Arena KOF" };

const SCHEDULE_LINK = { href: "/#schedule", label: "Cronograma" };

function renderClosed() {
  return render(
    <PublicBracketView
      initial={{ state: "closed", serverNow: 1 }}
      checkInStartsAt={CHECK_IN_STARTS_AT}
      checkInEndsAt={CHECK_IN_ENDS_AT}
      bracketGeneratesAt={BRACKET_GENERATES_AT}
      kofLink={KOF_LINK}
      scheduleLink={SCHEDULE_LINK}
    />,
  );
}

function renderOpen() {
  return render(
    <PublicBracketView
      initial={{ state: "open", bracket: toPublicBracket(createTestTournament()), serverNow: 1 }}
      checkInStartsAt={CHECK_IN_STARTS_AT}
      checkInEndsAt={CHECK_IN_ENDS_AT}
      bracketGeneratesAt={BRACKET_GENERATES_AT}
      kofLink={KOF_LINK}
      scheduleLink={SCHEDULE_LINK}
    />,
  );
}

describe("PublicBracketView while the bracket is not published (S9)", () => {
  it("tells when the KOF check-in and the bracket happen", () => {
    renderClosed();

    expect(screen.getByText(/10:00/)).toBeInTheDocument();
    expect(screen.getByText(/11:00/)).toBeInTheDocument();
    expect(screen.getByText(/12:00/)).toBeInTheDocument();
  });

  it("links to the KOF zone of the floor plan with the href passed by props", () => {
    renderClosed();

    expect(screen.getByRole("link", { name: "Arena KOF" })).toHaveAttribute("href", "/#floor-plan-kof");
  });

  it("links to the schedule section of the landing with the href passed by props", () => {
    renderClosed();

    expect(screen.getByRole("link", { name: "Cronograma" })).toHaveAttribute("href", "/#schedule");
  });

  it("leaves the published bracket view unchanged", () => {
    renderOpen();

    expect(screen.getByRole("heading", { name: "Tablero 1" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Arena KOF" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Cronograma" })).not.toBeInTheDocument();
  });
});
