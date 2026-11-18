import { render, screen, within } from "@testing-library/react";
import { TournamentInfo } from "@features/tournament/components/tournament-info";
import { MAX_ENTRANTS, MIN_ENTRANTS, PRE_LIST_LIMIT } from "@features/tournament/lib/tournament-rules";

// Instants of event_settings; America/Cancun renders them as 13.11.2026, 12:00, 12:45 and 12:55.
const SCHEDULE = {
  registrationOpensAt: "2026-11-13T05:00:00.000Z",
  checkInStartsAt: "2026-11-20T17:00:00.000Z",
  checkInEndsAt: "2026-11-20T17:45:00.000Z",
  onsiteStartsAt: "2026-11-20T17:00:00.000Z",
  onsiteEndsAt: "2026-11-20T17:45:00.000Z",
  bracketGeneratesAt: "2026-11-20T17:55:00.000Z",
};

function renderInfo() {
  return render(<TournamentInfo schedule={SCHEDULE} registerHref="/register" passportHref="/passport" />);
}

function getBlock(name: string) {
  return within(screen.getByRole("region", { name }));
}

describe("TournamentInfo (S5)", () => {
  it("tells when: the date, the check-in, the on-site sign-up and the bracket, from the settings", () => {
    renderInfo();

    const when = getBlock("Cuándo");

    expect(when.getByText(/20\.11\.2026/)).toBeInTheDocument();
    expect(when.getByText(/13\.11\.2026/)).toBeInTheDocument();
    expect(when.getByText(/Check-in: de 12:00 a 12:45/)).toBeInTheDocument();
    expect(when.getByText(/Inscripción en el lugar: de 12:00 a 12:45/)).toBeInTheDocument();
    expect(when.getByText(/bracket se genera a las 12:55/)).toBeInTheDocument();
  });

  it("tells how: the format of the tournament", () => {
    renderInfo();

    expect(getBlock("Cómo").getByText(/Eliminación directa/)).toHaveTextContent(
      "4 tableros de 16 jugadores, dos semifinales y la final (63 combates)",
    );
  });

  it("tells how to enter, step by step, using the register and passport links", () => {
    renderInfo();

    const how = getBlock("Cómo");

    expect(how.getAllByRole("listitem").length).toBeGreaterThanOrEqual(3);
    expect(how.getByRole("link", { name: "Crear mi pasaporte" })).toHaveAttribute("href", "/register");
    expect(how.getByRole("link", { name: "Ver mi pasaporte" })).toHaveAttribute("href", "/passport");
  });

  it("tells how many: the cap, the minimum and the pre-registration list, from the rules", () => {
    renderInfo();

    const howMany = getBlock("Cuántos");

    expect(howMany.getByText(new RegExp(`${MAX_ENTRANTS} jugadores`))).toBeInTheDocument();
    expect(howMany.getByText(new RegExp(`al menos ${MIN_ENTRANTS}`))).toBeInTheDocument();
    expect(howMany.getByText(new RegExp(`hasta ${PRE_LIST_LIMIT}`))).toBeInTheDocument();
  });

  it("does not offer the arena or the schedule buttons", () => {
    renderInfo();

    expect(screen.queryByRole("link", { name: "Arena KOF" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Cronograma" })).not.toBeInTheDocument();
  });
});
