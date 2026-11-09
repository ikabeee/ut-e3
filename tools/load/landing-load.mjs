// Load test of the published landing (RNF de carga): many phones open the landing at the same time.
//
//   BASE_URL=https://pixel.example USERS=1000 DURATION=60 npm run test:load
//
// Each virtual user opens the landing like a browser: the HTML first and, on its first visit, every script, style and
// image the HTML references (later visits come from its cache, as on a phone). With the kill switch on, it also checks
// that a blocked page still answers with a redirect while the server is busy. Plain Node 22, no dependencies.

const run = { settings: readSettings(process.env), stats: createStats() };

await runVirtualUsers(run);

printReport(run);

process.exitCode = hasFailed(run) ? 1 : 0;

function readSettings(env) {
  if (!env.BASE_URL) throw new Error("Define BASE_URL, por ejemplo BASE_URL=https://pixel.example npm run test:load");

  return {
    baseUrl: env.BASE_URL.replace(/\/$/, ""),
    users: Number(env.USERS ?? 200),
    durationMs: Number(env.DURATION ?? 30) * 1000,
    // The kill switch answers a blocked page with a redirect; set CHECK_BLOCKED=0 for the demo (SITE_MODE=full).
    checksBlockedPage: env.CHECK_BLOCKED !== "0",
    maxErrorRate: Number(env.MAX_ERROR_RATE ?? 0.01),
    maxP95Ms: Number(env.MAX_P95_MS ?? 1500),
  };
}

function createStats() {
  return { html: [], assets: [], blocked: [], statuses: new Map(), errors: new Map() };
}

async function runVirtualUsers(run) {
  const endsAt = Date.now() + run.settings.durationMs;
  const users = Array.from({ length: run.settings.users }, () => runVirtualUser(run, endsAt));

  await Promise.all(users);
}

async function runVirtualUser(run, endsAt) {
  const { settings, stats } = run;
  const cache = new Set();

  while (Date.now() < endsAt) {
    const html = await timedRequest(run, { durations: stats.html, path: "/" });

    if (html) await fetchNewAssets(run, cache, html);

    if (settings.checksBlockedPage) {
      await timedRequest(run, { durations: stats.blocked, path: "/passport", expectedStatus: 307 });
    }
  }
}

async function fetchNewAssets(run, cache, html) {
  const assets = listAssets(html).filter((asset) => !cache.has(asset));

  assets.forEach((asset) => cache.add(asset));
  await Promise.all(assets.map((path) => timedRequest(run, { durations: run.stats.assets, path })));
}

// Scripts, styles and optimized images that the HTML of Next points to.
function listAssets(html) {
  const paths = html.matchAll(/(?:src|href)="(\/_next\/(?:static|image)[^"]+)"/g);

  return [...new Set(Array.from(paths, (match) => match[1].replaceAll("&amp;", "&")))];
}

async function timedRequest({ settings, stats }, { durations, path, expectedStatus = 200 }) {
  const startedAt = performance.now();

  try {
    const response = await fetch(`${settings.baseUrl}${path}`, {
      redirect: "manual",
      signal: AbortSignal.timeout(15_000),
    });

    const body = await response.text();

    durations.push(performance.now() - startedAt);
    count(stats.statuses, response.status === expectedStatus ? "expected" : `unexpected ${response.status}`);

    return body;
  } catch (error) {
    count(stats.errors, error.name);

    return null;
  }
}

function count(counters, key) {
  counters.set(key, (counters.get(key) ?? 0) + 1);
}

function printReport({ settings, stats }) {
  const seconds = settings.durationMs / 1000;

  console.log(`\n${settings.users} usuarios durante ${seconds} s contra ${settings.baseUrl}\n`);
  console.table({
    "HTML de la portada": summarize(stats.html, seconds),
    "Scripts, estilos e imágenes": summarize(stats.assets, seconds),
    "Página bloqueada (307)": summarize(stats.blocked, seconds),
  });
  console.log("Respuestas:", Object.fromEntries(stats.statuses));
  console.log("Errores de red:", Object.fromEntries(stats.errors));
}

function summarize(durations, seconds) {
  const sorted = durations.toSorted((first, second) => first - second);

  return {
    peticiones: sorted.length,
    "por segundo": Math.round(sorted.length / seconds),
    "p50 ms": percentile(sorted, 0.5),
    "p95 ms": percentile(sorted, 0.95),
    "p99 ms": percentile(sorted, 0.99),
  };
}

function percentile(sorted, share) {
  if (sorted.length === 0) return 0;

  return Math.round(sorted[Math.min(sorted.length - 1, Math.floor(share * sorted.length))]);
}

function hasFailed({ settings, stats }) {
  const unexpected = sumWhere(stats.statuses, (key) => key !== "expected") + sumWhere(stats.errors, () => true);
  const total = sumWhere(stats.statuses, () => true) + sumWhere(stats.errors, () => true);
  const errorRate = total === 0 ? 1 : unexpected / total;
  const sortedHtml = stats.html.toSorted((first, second) => first - second);

  const htmlP95 = percentile(sortedHtml, 0.95);

  return errorRate > settings.maxErrorRate || htmlP95 > settings.maxP95Ms;
}

function sumWhere(counters, isIncluded) {
  return [...counters].reduce((sum, [key, value]) => (isIncluded(key) ? sum + value : sum), 0);
}
