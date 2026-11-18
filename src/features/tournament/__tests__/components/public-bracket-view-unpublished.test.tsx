import { act, screen } from "@testing-library/react";
import { PublicBracketView } from "@features/tournament/components/public-bracket-view";
import { POLL_INTERVAL_MS } from "@features/tournament/hooks/use-tournament";
import { toPublicBracket } from "@features/tournament/lib/public-bracket";
import { createTestTournament } from "@features/tournament/__tests__/tournament-test-utils";
import { renderWithToasts } from "@shared/__tests__/components/toast-test-utils";

describe("PublicBracketView while the bracket is not published (S5)", () => {
  it.each(["closed", "pending"] as const)("does not show the arena or schedule buttons when it is %s", (state) => {
    renderWithToasts(<PublicBracketView initial={{ state, serverNow: 1 }} />);

    expect(screen.queryByRole("link", { name: "Arena KOF" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Cronograma" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("leaves the published bracket view unchanged", () => {
    renderWithToasts(
      <PublicBracketView initial={{ state: "open", bracket: toPublicBracket(createTestTournament()), serverNow: 1 }} />,
    );

    expect(screen.getByRole("heading", { name: "Tablero 1" })).toBeInTheDocument();
  });
});

describe("PublicBracketView connection error (S6)", () => {
  it("is a toast, not the bordered box of the page", async () => {
    jest.useFakeTimers();

    try {
      const load = jest.fn().mockRejectedValue(new Error("offline"));

      const { container } = renderWithToasts(
        <PublicBracketView initial={{ state: "closed", serverNow: 1 }} load={load} />,
      );

      await act(async () => {
        await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
      });

      expect(screen.getByRole("alert")).toHaveTextContent("Sin conexión. Se muestra el último estado recibido.");
      expect(container).not.toHaveTextContent("Sin conexión");
      expect(container.querySelector(".border-danger")).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });
});
