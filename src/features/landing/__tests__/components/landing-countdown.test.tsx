import { act, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { LandingCountdown } from "@features/landing/components/landing-countdown";

const STARTS_AT = "2026-11-20T10:00:00-05:00";
const STARTS_AT_MS = new Date(STARTS_AT).getTime();

describe("LandingCountdown", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders a stable placeholder on the server", () => {
    const html = renderToString(<LandingCountdown startsAt={STARTS_AT} />);

    expect(html).toContain("--");
    expect(html).not.toMatch(/\d{2}<\/span>/);
  });

  it("shows the remaining time and ticks every second", () => {
    jest.useFakeTimers();
    jest.setSystemTime(STARTS_AT_MS - (24 * 86_400_000 + 5 * 3_600_000 + 12 * 60_000 + 32_000));

    render(<LandingCountdown startsAt={STARTS_AT} />);

    expect(screen.getByText("24")).toBeInTheDocument();
    expect(screen.getByText("05")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("32")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByText("31")).toBeInTheDocument();
  });

  it("announces a per-minute summary instead of every second", () => {
    jest.useFakeTimers();
    jest.setSystemTime(STARTS_AT_MS - (2 * 86_400_000 + 3 * 3_600_000 + 4 * 60_000 + 1000));

    render(<LandingCountdown startsAt={STARTS_AT} />);

    expect(screen.getByRole("status")).toHaveTextContent("Faltan 2 días, 3 horas y 4 minutos.");

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByRole("status")).toHaveTextContent("Faltan 2 días, 3 horas y 3 minutos.");
  });
});
