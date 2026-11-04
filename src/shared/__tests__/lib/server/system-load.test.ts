/**
 * @jest-environment node
 */
import { parseCgroupMemory } from "@shared/lib/server/system-load";

const GIB = 1024 ** 3;

describe("parseCgroupMemory (RF-73, RF-74)", () => {
  it("does not count the inactive page cache as used memory", () => {
    // A quiet container: 300 MiB of the process and 1.5 GiB of SQLite and build files in the cache, limit 2 GiB.
    const stat = `anon 314572800\nfile 1610612736\nactive_file 104857600\ninactive_file 1505755136\n`;

    expect(parseCgroupMemory({ max: `${2 * GIB}\n`, current: `${1.8 * GIB}\n`, stat })).toEqual({
      usedBytes: 1.8 * GIB - 1_505_755_136,
      totalBytes: 2 * GIB,
      source: "cgroup",
    });
  });

  it("keeps memory.current when memory.stat is missing", () => {
    expect(parseCgroupMemory({ max: String(GIB), current: String(GIB / 4), stat: "" })).toMatchObject({
      usedBytes: GIB / 4,
      totalBytes: GIB,
    });
  });

  it("falls back to the host without a limit or with unreadable numbers", () => {
    expect(parseCgroupMemory({ max: "max\n", current: "100", stat: "" })).toBeNull();
    expect(parseCgroupMemory({ max: "0", current: "100", stat: "" })).toBeNull();
    expect(parseCgroupMemory({ max: "abc", current: "100", stat: "" })).toBeNull();
  });
});
