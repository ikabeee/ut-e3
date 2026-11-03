import { act, render, screen } from "@testing-library/react";
import { restoreFetch, stubFetch } from "@features/games/__tests__/api/fetch-stub";
import { LiveItchLink } from "@features/games/components/live-itch-link";
import type { ItchLink } from "@features/games/lib/itch-link";

const OPENS_AT = "2026-11-20T21:30:00.000Z";

const PENDING: ItchLink = { status: "pending", opensAt: OPENS_AT };

const OPEN: ItchLink = { status: "open", url: "https://utg.itch.io/ceniza-protocol" };

let fetchMock: ReturnType<typeof stubFetch>;

let answers: ItchLink[] = [];

beforeEach(() => {
  jest.useFakeTimers({ advanceTimers: true });
  answers = [];
  fetchMock = stubFetch(async () => ({ status: 200, body: { link: answers.shift() ?? PENDING } }));
});

afterEach(() => {
  jest.useRealTimers();
  restoreFetch();
});

describe("LiveItchLink (RF-10)", () => {
  it("asks the server for the link of the game, never the page", async () => {
    answers = [PENDING];

    render(<LiveItchLink slug="ceniza-protocol" />);

    expect(await screen.findByText("El enlace a itch.io se activa a las 16:30.")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/games/ceniza-protocol/itch", { cache: "no-store" });
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("shows nothing until the server has answered", () => {
    fetchMock.mockImplementation(() => new Promise(() => undefined));

    const { container } = render(<LiveItchLink slug="ceniza-protocol" />);

    expect(container).toBeEmptyDOMElement();
  });

  it("asks again while the link is not open and shows it when the server opens it", async () => {
    answers = [PENDING, OPEN];

    render(<LiveItchLink slug="ceniza-protocol" />);
    await screen.findByText("El enlace a itch.io se activa a las 16:30.");
    await act(async () => {
      await jest.advanceTimersByTimeAsync(30_000);
    });

    expect(await screen.findByRole("link", { name: /Jugar en itch\.io/ })).toHaveAttribute("href", OPEN.url);
  });

  it("stops asking once the link is open", async () => {
    answers = [OPEN];

    render(<LiveItchLink slug="ceniza-protocol" />);
    await screen.findByRole("link", { name: /Jugar en itch\.io/ });

    const calls = fetchMock.mock.calls.length;

    await act(async () => {
      await jest.advanceTimersByTimeAsync(120_000);
    });

    expect(fetchMock).toHaveBeenCalledTimes(calls);
  });

  it("keeps the last answer when the network fails, and shows nothing if it never had one", async () => {
    answers = [PENDING];

    render(<LiveItchLink slug="ceniza-protocol" />);
    await screen.findByText("El enlace a itch.io se activa a las 16:30.");
    fetchMock.mockRejectedValue(new TypeError("offline"));
    await act(async () => {
      await jest.advanceTimersByTimeAsync(60_000);
    });

    expect(screen.getByText("El enlace a itch.io se activa a las 16:30.")).toBeInTheDocument();
  });

  it("renders nothing for a game without a link", async () => {
    answers = [{ status: "hidden" }];

    const { container } = render(<LiveItchLink slug="ceniza-protocol" />);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(0);
    });

    expect(container).toBeEmptyDOMElement();
  });
});
