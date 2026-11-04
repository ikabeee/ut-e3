/**
 * @jest-environment node
 */
import {
  buildPinFilter,
  isPinFilter,
  mayBeRegisteredPin,
  PIN_FILTER_ITERATIONS,
  PIN_FILTER_SPACE_FACTOR,
  reducePin,
  type PinFilter,
} from "@features/stands/lib/pin-filter";

const SALT = "ut-e3-pixel-and-code-2026";

// 1,000 registered PINs spread over the 100,000 possible ones.
const REGISTERED = Array.from({ length: 1000 }, (_, index) => String(index * 97 + 3).padStart(5, "0"));

// Hashing in chunks keeps the 99,000 pending hashes from piling up in memory when the suite runs in parallel.
const CHUNK = 2000;

describe("buildPinFilter", () => {
  let filter: PinFilter;

  // Reducing the 100,000 PINs with the real rounds would take minutes; one round keeps the same reduction.
  beforeAll(async () => {
    filter = await buildPinFilter(REGISTERED, SALT, 1);
  }, 30_000);

  it("lets every registered PIN pass: the filter has no false negatives (UT-CI-29)", async () => {
    const passes = await Promise.all(REGISTERED.map((pin) => mayBeRegisteredPin(pin, filter)));

    expect(passes.every(Boolean)).toBe(true);
  });

  it("lets between 1.5 % and 2.5 % of the other PINs pass (UT-CI-30, RNF-19)", async () => {
    const registered = new Set(REGISTERED);

    const others = Array.from({ length: 100_000 }, (_, value) => String(value).padStart(5, "0")).filter(
      (pin) => !registered.has(pin),
    );

    const rate = (await countPassing(others, filter)) / others.length;

    expect(others).toHaveLength(99_000);
    expect(rate).toBeGreaterThanOrEqual(0.015);
    expect(rate).toBeLessThanOrEqual(0.025);
  }, 120_000);

  it("reduces to a space 50 times the registered PINs and keeps neither the PINs nor the digests", async () => {
    const filter = await buildPinFilter(["12345", "54321"], SALT);

    expect(filter).toMatchObject({
      salt: SALT,
      iterations: PIN_FILTER_ITERATIONS,
      modulus: 2 * PIN_FILTER_SPACE_FACTOR,
    });
    expect(filter.values.every((value) => value >= 0 && value < filter.modulus)).toBe(true);
    expect(JSON.stringify(filter)).not.toMatch(/12345|54321/);
  });

  it("gives the same value for the same PIN and salt, and another one with another salt", async () => {
    const params = { salt: SALT, iterations: 10, modulus: 5_000_000 };

    expect(await reducePin("12345", params)).toBe(await reducePin("12345", params));
    expect(await reducePin("12345", params)).not.toBe(await reducePin("12345", { ...params, salt: "otra" }));
  });

  it("lets nothing pass when there are no registered PINs", async () => {
    const filter = await buildPinFilter([], SALT, 1);

    expect(filter.values).toEqual([]);
    expect(await mayBeRegisteredPin("12345", filter)).toBe(false);
  });
});

describe("isPinFilter", () => {
  it("accepts a filter and refuses what is not one", () => {
    expect(isPinFilter({ salt: "s", iterations: 1, modulus: 50, values: [1, 2] })).toBe(true);
    expect(isPinFilter({ salt: "s", iterations: 0, modulus: 50, values: [] })).toBe(false);
    expect(isPinFilter({ salt: "s", iterations: 1, modulus: 50, values: ["1"] })).toBe(false);
    expect(isPinFilter(null)).toBe(false);
  });
});

async function countPassing(pins: string[], filter: PinFilter): Promise<number> {
  const values = new Set(filter.values);
  let passing = 0;

  for (let start = 0; start < pins.length; start += CHUNK) {
    const reduced = await Promise.all(pins.slice(start, start + CHUNK).map((pin) => reducePin(pin, filter)));

    passing += reduced.filter((value) => values.has(value)).length;
  }

  return passing;
}
