"use client";

import { useEffect } from "react";
import { startCapturingInstallPrompt } from "@features/pwa/lib/install-prompt-store";
import { PRECACHE_API_PATH, SERVICE_WORKER_PATH } from "@features/pwa/lib/pwa-links";
import { isRegistrablePath, shouldPrecache } from "@features/pwa/lib/registration-scope";

const LAST_PRECACHE_KEY = "ute3.precache.at";

/**
 * Registers the service worker from the public pages and the visitor pages (RNF-14) and keeps the install prompt that
 * the browser offers. It does nothing in development, where cached chunks would hide the changes of the code, and it
 * never registers from the staff areas.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    const stopCapturing = startCapturingInstallPrompt();

    void registerWorker(window.location.pathname);

    return stopCapturing;
  }, []);

  return null;
}

async function registerWorker(pathname: string): Promise<void> {
  const canRegister = process.env.NODE_ENV === "production" && "serviceWorker" in navigator;

  if (!canRegister || !isRegistrablePath(pathname)) return;

  try {
    await navigator.serviceWorker.register(SERVICE_WORKER_PATH, { scope: "/" });
    await requestPrecache();
  } catch {
    // Without a worker the app works as a normal website.
  }
}

// Asks the worker to save the catalog, the game pages and the floor plan once the worker is running.
async function requestPrecache(): Promise<void> {
  const registration = await navigator.serviceWorker.ready;
  const lastAt = readLastPrecache();

  if (!registration.active || !shouldPrecache({ lastAt, now: Date.now() })) return;

  const response = await fetch(PRECACHE_API_PATH, { cache: "no-store" });

  if (!response.ok) return;

  const body = await response.json();

  if (!isPathList(body)) return;

  registration.active.postMessage({ type: "precache", paths: body.paths });
  writeLastPrecache(Date.now());
}

function isPathList(value: unknown): value is { paths: string[] } {
  return typeof value === "object" && value !== null && "paths" in value && Array.isArray(value.paths);
}

function readLastPrecache(): number | null {
  try {
    const raw = window.localStorage.getItem(LAST_PRECACHE_KEY);

    return raw === null ? null : Number(raw);
  } catch {
    return null;
  }
}

function writeLastPrecache(at: number): void {
  try {
    window.localStorage.setItem(LAST_PRECACHE_KEY, String(at));
  } catch {
    // A private window without storage asks again on the next page: harmless.
  }
}
