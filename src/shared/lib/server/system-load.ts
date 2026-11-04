import "server-only";
import { readFileSync } from "node:fs";
import os from "node:os";

/** One reading of the machine: CPU and memory as fractions from 0 to 1, taken at `at` (ms since the epoch). */
export interface LoadSample {
  at: number;
  cpu: number;
  memory: number;
}

export interface MemoryReading {
  usedBytes: number;
  totalBytes: number;
  /** Where the numbers come from: the limit of the container (cgroup v2) or the whole machine. */
  source: "cgroup" | "host";
}

interface CpuTimes {
  idle: number;
  total: number;
}

interface LoadStore {
  samples: LoadSample[];
  lastCpu: CpuTimes | null;
}

/** How much history the panel keeps: 15 minutes at one sample every 10 seconds. */
export const MAX_SAMPLES = 90;

const CGROUP_MEMORY_MAX = "/sys/fs/cgroup/memory.max";

const CGROUP_MEMORY_CURRENT = "/sys/fs/cgroup/memory.current";

/**
 * Takes a sample and keeps it in the history of this process. CPU is the share of busy time of all the cores since the
 * previous sample, so the first one reads the time since the machine started.
 */
export function takeLoadSample(now: number = Date.now()): LoadSample {
  const store = getStore();
  const cpuTimes = readCpuTimes();
  const memory = readMemory();

  const sample = {
    at: now,
    cpu: cpuShare(store.lastCpu, cpuTimes),
    memory: memory.totalBytes > 0 ? memory.usedBytes / memory.totalBytes : 0,
  };

  store.lastCpu = cpuTimes;
  recordLoadSample(sample);

  return sample;
}

/** Adds a sample to the history; takeLoadSample uses it, and a test can feed the history with known values. */
export function recordLoadSample(sample: LoadSample): void {
  const store = getStore();

  store.samples = [...store.samples, sample].slice(-MAX_SAMPLES);
}

export function getLoadSamples(): readonly LoadSample[] {
  return getStore().samples;
}

/** Starts over the history, so a rule that looks at the last minutes needs those minutes again. */
export function clearLoadSamples(): void {
  getStore().samples = [];
}

export function readMemory(): MemoryReading {
  const cgroup = readCgroupMemory();

  if (cgroup) return cgroup;

  const totalBytes = os.totalmem();

  return { usedBytes: totalBytes - os.freemem(), totalBytes, source: "host" };
}

// Route Handlers, pages and instrumentation.ts can load this module more than once; the history lives on globalThis.
function getStore(): LoadStore {
  const holder: typeof globalThis & { ute3SystemLoad?: LoadStore } = globalThis;

  holder.ute3SystemLoad ??= { samples: [], lastCpu: null };

  return holder.ute3SystemLoad;
}

function readCpuTimes(): CpuTimes {
  return os.cpus().reduce(
    (sum, cpu) => {
      const { user, nice, sys, idle, irq } = cpu.times;

      return { idle: sum.idle + idle, total: sum.total + user + nice + sys + idle + irq };
    },
    { idle: 0, total: 0 },
  );
}

function cpuShare(previous: CpuTimes | null, current: CpuTimes): number {
  const idle = current.idle - (previous?.idle ?? 0);
  const total = current.total - (previous?.total ?? 0);

  return total > 0 ? Math.min(1, Math.max(0, 1 - idle / total)) : 0;
}

// Inside Docker the machine numbers are the ones of the host; the cgroup says what the container may use.
function readCgroupMemory(): MemoryReading | null {
  try {
    const max = readFileSync(CGROUP_MEMORY_MAX, "utf8").trim();
    const current = Number(readFileSync(CGROUP_MEMORY_CURRENT, "utf8").trim());

    if (max === "max" || !Number.isFinite(current)) return null;

    return { usedBytes: current, totalBytes: Number(max), source: "cgroup" };
  } catch {
    return null;
  }
}
