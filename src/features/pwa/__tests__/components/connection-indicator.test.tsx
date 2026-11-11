import { act, render, screen } from "@testing-library/react";
import { ConnectionIndicator } from "@features/pwa/components/connection-indicator";
import { createRouter, setNetwork, withRouter } from "@features/pwa/__tests__/components/router-test-utils";
import { PWA_COPY } from "@features/pwa/lib/pwa-copy";

const COPY = PWA_COPY.connection;

const refresh = jest.fn();

afterEach(() => {
  jest.restoreAllMocks();
  refresh.mockClear();
});

describe("ConnectionIndicator (item 6)", () => {
  it("says the phone is online", () => {
    renderIndicator();

    expect(screen.getByRole("status", { name: COPY.label })).toHaveTextContent(COPY.online);
  });

  it("says when the connection is lost and when it returns", () => {
    renderIndicator();

    act(() => setNetwork(false));

    expect(screen.getByRole("status", { name: COPY.label })).toHaveTextContent(COPY.offline);
    expect(screen.getByRole("status", { name: COPY.label })).toHaveAttribute("data-connection", "offline");

    act(() => setNetwork(true));

    expect(screen.getByRole("status", { name: COPY.label })).toHaveTextContent(COPY.online);
  });

  it("retries by refreshing the data of the page when the network returns", () => {
    renderIndicator();

    act(() => setNetwork(false));

    expect(refresh).not.toHaveBeenCalled();

    act(() => setNetwork(true));

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("does not refresh when it was online all along", () => {
    renderIndicator();

    act(() => setNetwork(true));

    expect(refresh).not.toHaveBeenCalled();
  });
});

function renderIndicator() {
  return render(withRouter(createRouter(refresh), <ConnectionIndicator />));
}
