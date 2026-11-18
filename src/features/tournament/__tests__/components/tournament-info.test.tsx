import { render, screen, waitFor, within } from "@testing-library/react";
import { TournamentInfo } from "@features/tournament/components/tournament-info";
import { MAX_ENTRANTS, MIN_ENTRANTS, PRE_LIST_LIMIT } from "@features/tournament/lib/tournament-rules";

const SNAPSHOT_KEY = "ute3.passport.v1";

afterEach(() => window.localStorage.clear());

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
  return render(
    <TournamentInfo
      schedule={SCHEDULE}
      registerHref="/register"
      passportHref="/passport"
      passportSnapshotKey={SNAPSHOT_KEY}
    />,
  );
}

function getBlock(name: string) {
  return within(screen.getByRole("region", { name }));
}

describe("TournamentInfo (S5)", () => {
  it("tells when, grouped by date with a readable Spanish date, from the settings (S31)", () => {
    renderInfo();

    const when = getBlock("Cuándo");
    const groups = when.getAllByRole("group");

    expect(groups).toHaveLength(2);
    expect(within(groups[0]).getByText("Viernes 13 de noviembre")).toBeInTheDocument();
    expect(within(groups[0]).getByText("Abre la inscripción")).toBeInTheDocument();
    expect(within(groups[1]).getByText("Viernes 20 de noviembre")).toBeInTheDocument();
    expect(within(groups[1]).getByText("Check-in de 12:00 a 12:45")).toBeInTheDocument();
    expect(within(groups[1]).getByText("Inscripción en el lugar de 12:00 a 12:45")).toBeInTheDocument();
    expect(within(groups[1]).getByText("El bracket se genera a las 12:55")).toBeInTheDocument();
    expect(when.queryByText(/\d{2}\.\d{2}\.\d{4}/)).not.toBeInTheDocument();
  });

  it("tells how: the format of the tournament", () => {
    renderInfo();

    expect(getBlock("Cómo").getByText(/Eliminación directa/)).toHaveTextContent(
      "4 tableros de 16 jugadores, dos semifinales y la final (63 combates)",
    );
  });

  it("tells how to enter, step by step, and offers Crear mi pasaporte when there is no passport (S30)", () => {
    renderInfo();

    const how = getBlock("Cómo");

    expect(how.getAllByRole("listitem").length).toBeGreaterThanOrEqual(3);
    expect(how.getByRole("link", { name: "Crear mi pasaporte" })).toHaveAttribute("href", "/register");
    expect(how.queryByRole("link", { name: "Ver mi pasaporte" })).not.toBeInTheDocument();
  });

  it("offers only Ver mi pasaporte when this device already has a passport (S30)", async () => {
    window.localStorage.setItem(SNAPSHOT_KEY, JSON.stringify({ savedAt: "2026-11-20T17:00:00.000Z" }));

    renderInfo();

    const how = getBlock("Cómo");

    await waitFor(() =>
      expect(how.getByRole("link", { name: "Ver mi pasaporte" })).toHaveAttribute("href", "/passport"),
    );
    expect(how.queryByRole("link", { name: "Crear mi pasaporte" })).not.toBeInTheDocument();
  });

  it("centers the information (S32)", () => {
    renderInfo();

    expect(screen.getByRole("region", { name: "Información del torneo" })).toHaveClass("mx-auto");
    expect(screen.getByRole("region", { name: "Cómo" })).toHaveClass("text-center");
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
