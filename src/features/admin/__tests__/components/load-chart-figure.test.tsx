import { render, screen } from "@testing-library/react";
import { LoadChartFigure } from "@features/admin/components/load-chart-figure";

const NOON = Date.UTC(2026, 10, 20, 17, 0);

describe("LoadChartFigure", () => {
  it("explains that the line needs two readings when the history is too short", () => {
    render(<LoadChartFigure metric="cpu" history={[{ at: NOON, cpu: 0.4, memory: 0.5 }]} />);

    expect(screen.getByText("CPU ocupada")).toBeInTheDocument();
    expect(screen.getByText(/Todavía no hay dos lecturas/)).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("draws the memory with the current reading, the peak and the hours it covers", () => {
    const history = [
      { at: NOON, cpu: 0.1, memory: 0.9 },
      { at: NOON + 300_000, cpu: 0.1, memory: 0.4 },
    ];

    render(<LoadChartFigure metric="memory" history={history} />);

    expect(screen.getByText("Ahora: 40.0%. Máximo del periodo: 90.0%.")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Memoria en uso de las 12:00 a las 12:05, contra el límite de 85.0%." }),
    ).toBeInTheDocument();
    expect(screen.getByText("85.0%: cierre automático")).toBeInTheDocument();
  });
});
