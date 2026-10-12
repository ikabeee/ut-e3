import type { StandTraffic, StandTrafficReport } from "@features/visitors/lib/types";

/** Ruta pública de la afluencia (`src/app/api/stand-traffic/route.ts` -> `api/stand-traffic-route.ts`). */
export const STAND_TRAFFIC_API_PATH = "/api/stand-traffic";

function fail(path: string): never {
  throw new Error(`La respuesta de la afluencia no tiene el formato esperado (${path}).`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function parseStand(value: unknown, path: string): StandTraffic {
  if (!isRecord(value)) fail(path);
  const { standCode, recentCheckIns } = value;
  if (typeof standCode !== "string") fail(`${path}.standCode`);
  if (!isCount(recentCheckIns)) fail(`${path}.recentCheckIns`);
  return { standCode, recentCheckIns };
}

/** Valida el JSON de `/api/stand-traffic`. Lanza un error que nombra el primer campo inválido. */
export function parseStandTrafficResponse(value: unknown): StandTrafficReport {
  if (!isRecord(value)) fail("se esperaba un objeto");
  const { windowMinutes, stands } = value;
  if (!isCount(windowMinutes)) fail("windowMinutes");
  if (!Array.isArray(stands)) fail("stands");
  return { windowMinutes, stands: stands.map((stand, index) => parseStand(stand, `stands[${index}]`)) };
}

/** Lee la afluencia desde el Route Handler y valida la respuesta. Se ejecuta en el navegador. */
export async function fetchStandTraffic(): Promise<StandTrafficReport> {
  const response = await fetch(STAND_TRAFFIC_API_PATH);
  if (!response.ok) {
    throw new Error(`No se pudo cargar la afluencia (${response.status}).`);
  }
  return parseStandTrafficResponse(await response.json());
}
