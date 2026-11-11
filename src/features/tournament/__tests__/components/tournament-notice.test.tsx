import { render, screen } from "@testing-library/react";
import { TournamentNotice } from "@features/tournament/components/tournament-notice";

// The hours come from event_settings: 12:00 to 12:45 in Cancun (UTC-5) on 20 November.
const CHECK_IN_STARTS_AT = "2026-11-20T17:00:00.000Z";

const CHECK_IN_ENDS_AT = "2026-11-20T17:45:00.000Z";

describe("TournamentNotice", () => {
  it("tells a pre-registered player when and where to check in, with the hours it receives (UT-TO-43)", () => {
    render(
      <TournamentNotice status="registered" checkInStartsAt={CHECK_IN_STARTS_AT} checkInEndsAt={CHECK_IN_ENDS_AT} />,
    );

    const notice = screen.getByRole("region", { name: "Torneo de KOF" });

    expect(notice).toHaveTextContent("Estás inscrito en el torneo");
    expect(notice).toHaveTextContent("20.11.2026");
    expect(notice).toHaveTextContent("de 12:00 a 12:45");
    expect(notice).toHaveTextContent("área de KOF del Edificio B");
  });

  it("follows the hours of the settings instead of a fixed time", () => {
    render(
      <TournamentNotice
        status="registered"
        checkInStartsAt="2026-11-20T18:00:00.000Z"
        checkInEndsAt="2026-11-20T18:30:00.000Z"
      />,
    );

    expect(screen.getByRole("region", { name: "Torneo de KOF" })).toHaveTextContent("de 13:00 a 13:30");
  });

  it("confirms the check-in once it is done", () => {
    render(
      <TournamentNotice status="checked_in" checkInStartsAt={CHECK_IN_STARTS_AT} checkInEndsAt={CHECK_IN_ENDS_AT} />,
    );

    expect(screen.getByRole("region", { name: "Torneo de KOF" })).toHaveTextContent("ya estás en el bracket");
  });

  it("says when the player missed the check-in", () => {
    render(<TournamentNotice status="no_show" checkInStartsAt={CHECK_IN_STARTS_AT} checkInEndsAt={CHECK_IN_ENDS_AT} />);

    expect(screen.getByRole("region", { name: "Torneo de KOF" })).toHaveTextContent("quedaste fuera del torneo");
  });
});
