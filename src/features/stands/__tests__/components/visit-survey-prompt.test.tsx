import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppRouterContext, type AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { VisitSurveyPrompt } from "@features/stands/components/visit-survey-prompt";
import type { PendingVisitView } from "@features/stands/lib/pending-visit";
import type { VisitActionState } from "@features/stands/lib/stands-actions";

const refresh = jest.fn();

// The App Router provides the router through this context; jest.mock is not allowed in this repository.
const ROUTER = { refresh } as unknown as AppRouterInstance;

const PENDING: PendingVisitView = { id: "pending-1", standCode: "ZA-S1", gameName: "Pixel Quest" };

const SENT: FormData[] = [];

let pending: PendingVisitView | null = null;

beforeEach(() => {
  SENT.length = 0;
  pending = null;
  refresh.mockClear();
  jest.useFakeTimers({ advanceTimers: true });
});

afterEach(() => {
  jest.useRealTimers();
});

describe("VisitSurveyPrompt", () => {
  it("shows nothing while no visit waits for the visitor", async () => {
    renderPrompt();
    await advance(3000);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the survey of the stand when the staff types the PIN", async () => {
    renderPrompt();
    pending = PENDING;
    await advance(3000);

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Acabas de visitar el stand ZA-S1 · Pixel Quest")).toBeInTheDocument();
    expect(screen.getAllByRole("group")).toHaveLength(3);
  });

  it("does not send the survey until the three questions are answered", async () => {
    await openSurvey();
    await rate("El juego", "5");
    await userEvent.click(screen.getByRole("button", { name: "Enviar y registrar mi visita" }));

    expect(SENT).toHaveLength(0);
  });

  it("sends the three ratings, thanks the visitor and refreshes the passport", async () => {
    await openSurvey();
    await rate("El juego", "5");
    await rate("El stand", "4");
    await rate("El arte", "3");
    await userEvent.click(screen.getByRole("button", { name: "Enviar y registrar mi visita" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Tu visita quedó registrada");
    expect(SENT.map((form) => Object.fromEntries(form.entries()))).toEqual([
      { gameRating: "5", standRating: "4", artRating: "3" },
    ]);
    expect(refresh).not.toHaveBeenCalled();

    pending = null;
    await advance(4000);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
  });

  it("shows why the server refused the answer and keeps the survey open", async () => {
    await openSurvey({ message: "Esta visita ya no está esperando tu calificación." });
    await rate("El juego", "1");
    await rate("El stand", "1");
    await rate("El arte", "1");
    await userEvent.click(screen.getByRole("button", { name: "Enviar y registrar mi visita" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("ya no está esperando");
    expect(refresh).not.toHaveBeenCalled();
  });

  it("closes the survey when the staff cancels or the time runs out", async () => {
    await openSurvey();
    pending = null;
    await advance(3000);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

function renderPrompt(failure?: { message: string }) {
  const answerVisit = async (_previous: VisitActionState | null, form: FormData): Promise<VisitActionState> => {
    if (failure) return { status: "error", message: failure.message };

    SENT.push(form);

    return { status: "done", message: "¡Gracias! Tu visita quedó registrada." };
  };

  return render(
    <AppRouterContext.Provider value={ROUTER}>
      <VisitSurveyPrompt answerVisit={answerVisit} loadPending={async () => pending} />
    </AppRouterContext.Provider>,
  );
}

async function openSurvey(failure?: { message: string }) {
  renderPrompt(failure);
  pending = PENDING;
  await advance(3000);
  await screen.findByRole("dialog");
}

async function rate(question: string, value: string) {
  await userEvent.click(within(screen.getByRole("group", { name: question })).getByLabelText(value));
}

async function advance(milliseconds: number) {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(milliseconds);
  });
}
