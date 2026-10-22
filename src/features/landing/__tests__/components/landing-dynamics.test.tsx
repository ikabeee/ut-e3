import { render, screen } from "@testing-library/react";
import { EVENT_DYNAMICS } from "@features/landing/lib/event-content";
import { LandingDynamics } from "@features/landing/components/landing-dynamics";

describe("LandingDynamics", () => {
  it("renders the title, subtitle and one card per dynamic", () => {
    render(<LandingDynamics dynamics={EVENT_DYNAMICS} gamesCount={18} />);

    expect(screen.getByRole("heading", { level: 2, name: "Torneos y dinámicas" })).toBeInTheDocument();
    expect(screen.getByText("Participa y gana premios")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem").filter((item) => item.querySelector("h3"))).toHaveLength(3);
  });

  it("shows tournament format, quota and prize", () => {
    render(<LandingDynamics dynamics={EVENT_DYNAMICS} gamesCount={18} />);

    expect(screen.getAllByText("1 VS 1")).toHaveLength(2);
    expect(screen.getAllByText("64 Jugadores")).toHaveLength(2);
    expect(screen.getByText("Premio al campeón")).toBeInTheDocument();
    expect(screen.getByText("Premio para los 3 primeros")).toBeInTheDocument();
  });

  it("derives the raffle requirement from the games count", () => {
    render(<LandingDynamics dynamics={EVENT_DYNAMICS} gamesCount={21} />);

    expect(screen.getByText("Quienes prueben los 21 juegos")).toBeInTheDocument();
    expect(screen.getByText("Premio para 30 personas")).toBeInTheDocument();
  });

  it("links the arrow only on the cards that have an href", () => {
    render(<LandingDynamics dynamics={EVENT_DYNAMICS} gamesCount={18} hrefs={{ raffle: "/passport" }} />);

    expect(screen.getByRole("link", { name: "Ver Gran rifa" })).toHaveAttribute("href", "/passport");
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("renders a decorative arrow on every card without a link", () => {
    const { container } = render(<LandingDynamics dynamics={EVENT_DYNAMICS} gamesCount={18} />);

    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(container.querySelectorAll("span[aria-hidden='true'].rounded-full")).toHaveLength(3);
  });
});
