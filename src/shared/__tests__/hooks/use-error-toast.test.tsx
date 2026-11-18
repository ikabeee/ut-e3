import { act, screen } from "@testing-library/react";
import { renderWithToasts } from "@shared/__tests__/components/toast-test-utils";
import { useErrorToast } from "@shared/hooks/use-error-toast";

const MESSAGE = "No pudimos guardar el cambio.";

function ErrorSource({ error, source }: Readonly<{ error: string | null; source?: object }>) {
  useErrorToast(error, source);

  return <p>contenido</p>;
}

describe("useErrorToast (S7)", () => {
  it("shows the error as an alert toast and nothing in the component itself", () => {
    const { container } = renderWithToasts(<ErrorSource error={MESSAGE} />);

    expect(screen.getByRole("alert")).toHaveTextContent(MESSAGE);
    expect(container).toHaveTextContent(/^contenido$/);
  });

  it("shows nothing while there is no error", () => {
    renderWithToasts(<ErrorSource error={null} />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("takes the toast away once the error is gone", async () => {
    const { rerender } = renderWithToasts(<ErrorSource error={MESSAGE} />);

    rerender(<ErrorSource error={null} />);
    await waitForExit();

    expect(screen.queryByText(MESSAGE)).not.toBeInTheDocument();
  });

  it("shows the same message again when a new answer brings it, without stacking the old one", async () => {
    const { rerender } = renderWithToasts(<ErrorSource error={MESSAGE} source={{ attempt: 1 }} />);

    rerender(<ErrorSource error={MESSAGE} source={{ attempt: 2 }} />);
    await waitForExit();

    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(screen.getByRole("alert")).toHaveTextContent(MESSAGE);
  });
});

async function waitForExit(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 400));
  });
}
