import { act, renderHook } from "@testing-library/react";
import { useBracketPlayback } from "@features/tournament/hooks/use-bracket-playback";
import { toPublicBracket } from "@features/tournament/lib/public-bracket";
import {
  createTestTournament,
  playMatches,
  startAndFinish,
} from "@features/tournament/__tests__/tournament-test-utils";

const base = createTestTournament();

function bracketAfter(numbers: number[]) {
  return toPublicBracket(playMatches(base, numbers));
}

function tagIn(bracket: ReturnType<typeof toPublicBracket>, number: number, slot: 0 | 1) {
  return bracket.matches.find((match) => match.number === number)?.players[slot].tag;
}

function stubMotion(isReduced: boolean) {
  jest.spyOn(window, "matchMedia").mockImplementation((query) => ({
    matches: isReduced,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }));
}

// Each phase arms its timer after a render, so the clock moves in small steps and lets React render in between.
function wait(ms: number) {
  for (let elapsed = 0; elapsed < ms; elapsed += 50) {
    act(() => {
      jest.advanceTimersByTime(50);
    });
  }
}

beforeEach(() => {
  jest.useFakeTimers();
  stubMotion(false);
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe("useBracketPlayback (S8)", () => {
  it("shows the first answer as it is, without playing anything", () => {
    const first = bracketAfter([1]);
    const { result } = renderHook(() => useBracketPlayback(first));

    expect(result.current.displayed).toBe(first);
    expect(result.current.current).toBeNull();
  });

  it("holds the result back, approaches the match, then decides it and then moves the winner on", () => {
    const first = toPublicBracket(base);
    const second = bracketAfter([1]);

    const { result, rerender } = renderHook(({ bracket }) => useBracketPlayback(bracket), {
      initialProps: { bracket: first },
    });

    rerender({ bracket: second });

    expect(result.current.current).toMatchObject({ number: 1, phase: "approach" });
    expect(result.current.displayed.matches[0].status).not.toBe("finished");

    wait(900);

    expect(result.current.current).toMatchObject({ number: 1, phase: "decide" });
    expect(result.current.displayed.matches[0].status).toBe("finished");
    expect(tagIn(result.current.displayed, 9, 0)).toBe("Por definir");

    wait(1000);

    expect(result.current.current).toMatchObject({ number: 1, phase: "advance" });
    expect(tagIn(result.current.displayed, 9, 0)).toBe(tagIn(second, 9, 0));

    wait(800);

    expect(result.current.current).toBeNull();
    expect(result.current.displayed).toEqual(second);
  });

  it("queues results that arrive together and plays them one after another", () => {
    const first = toPublicBracket(base);
    const second = bracketAfter([1, 31]);

    const { result, rerender } = renderHook(({ bracket }) => useBracketPlayback(bracket), {
      initialProps: { bracket: first },
    });

    rerender({ bracket: second });

    expect(result.current.current?.number).toBe(1);
    expect(result.current.displayed.matches.find((match) => match.number === 31)?.status).not.toBe("finished");

    wait(2700);

    expect(result.current.current?.number).toBe(31);
    expect(result.current.displayed.matches.find((match) => match.number === 1)?.status).toBe("finished");

    wait(2700);

    expect(result.current.current).toBeNull();
    expect(result.current.displayed).toEqual(second);
  });

  it("queues a result that arrives while another one is playing", () => {
    const first = toPublicBracket(base);

    const { result, rerender } = renderHook(({ bracket }) => useBracketPlayback(bracket), {
      initialProps: { bracket: first },
    });

    rerender({ bracket: bracketAfter([1]) });
    wait(300);
    rerender({ bracket: bracketAfter([1, 31]) });

    expect(result.current.current?.number).toBe(1);

    wait(2700 - 300);

    expect(result.current.current?.number).toBe(31);
  });

  it("plays a long queue faster so the view does not fall behind", () => {
    const first = toPublicBracket(base);
    const second = bracketAfter([1, 2, 3, 4, 5, 6]);

    const { result, rerender } = renderHook(({ bracket }) => useBracketPlayback(bracket), {
      initialProps: { bracket: first },
    });

    rerender({ bracket: second });
    wait(1350 * 3 + 2700 * 3);

    expect(result.current.current).toBeNull();
  });

  it("shows everything at once when the person asked for less motion", () => {
    stubMotion(true);

    const first = toPublicBracket(base);
    const second = bracketAfter([1, 31]);

    const { result, rerender } = renderHook(({ bracket }) => useBracketPlayback(bracket), {
      initialProps: { bracket: first },
    });

    rerender({ bracket: second });

    expect(result.current.displayed).toBe(second);
    expect(result.current.current).toBeNull();
  });

  it("does not play a thing when the answer brings no new result", () => {
    const first = bracketAfter([1]);

    const { result, rerender } = renderHook(({ bracket }) => useBracketPlayback(bracket), {
      initialProps: { bracket: first },
    });

    rerender({ bracket: toPublicBracket(startAndFinish(base, 1, 1)) });

    expect(result.current.current).toBeNull();
  });
});
