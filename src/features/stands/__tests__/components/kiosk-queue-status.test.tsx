import { render, screen, within } from "@testing-library/react";
import { KioskQueueStatus } from "@features/stands/components/kiosk-queue-status";
import { RejectedVisitNotices } from "@features/stands/components/rejected-visit-notices";

describe("KioskQueueStatus", () => {
  it("says how many visits wait without connection and never shows a rating (UT-CI-22)", () => {
    render(<KioskQueueStatus isOnline={false} pendingCount={3} phase="idle" rejected={[]} />);

    expect(screen.getByRole("status")).toHaveTextContent("Sin conexión · 3 visitas por enviar");
    expect(screen.queryByText(/[1-5]\s*\/\s*5|Califica/)).not.toBeInTheDocument();
  });

  it("says it is sending, retrying or that everything was sent", () => {
    const { rerender } = render(<KioskQueueStatus isOnline pendingCount={1} phase="sending" rejected={[]} />);

    expect(screen.getByRole("status")).toHaveTextContent("Enviando… · 1 visita por enviar");

    rerender(<KioskQueueStatus isOnline pendingCount={2} phase="retrying" rejected={[]} />);
    expect(screen.getByRole("status")).toHaveTextContent("Sin respuesta del servidor · 2 visitas por enviar");

    rerender(<KioskQueueStatus isOnline pendingCount={0} phase="allSent" rejected={[]} />);
    expect(screen.getByRole("status")).toHaveTextContent("Todo enviado");
  });

  it("shows nothing online with an empty queue and nothing refused", () => {
    const { container } = render(<KioskQueueStatus isOnline pendingCount={0} phase="idle" rejected={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("lists an unknownVisitor refusal with its reason and instruction, without a gamertag (UT-CI-23)", () => {
    render(
      <KioskQueueStatus
        isOnline
        pendingCount={0}
        phase="allSent"
        rejected={[{ id: "a", reason: "unknownVisitor", scannedAt: "2026-11-20T20:15:00.000Z" }]}
      />,
    );

    const list = screen.getByRole("heading", { name: "No registradas" }).parentElement;

    expect(list).not.toBeNull();

    const item = within(list ?? document.body).getByRole("listitem");

    expect(item).toHaveTextContent("PIN tecleado a las 15:15");
    expect(item).toHaveTextContent("PIN no reconocido.");
    expect(item).toHaveTextContent("Que revise su pasaporte o vaya a Atención");
    expect(item).not.toHaveTextContent(/\d{5}/);
  });
});

describe("RejectedVisitNotices", () => {
  it("tells the visitor which visit was not recorded and why (RF-24)", () => {
    render(<RejectedVisitNotices notices={[{ id: "a", standCode: "ZA-S3" }]} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Tu visita a ZA-S3 no se registró");
    expect(screen.getByRole("alert")).toHaveTextContent("después del cierre del registro de visitas");
  });

  it("shows nothing without refusals", () => {
    const { container } = render(<RejectedVisitNotices notices={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
