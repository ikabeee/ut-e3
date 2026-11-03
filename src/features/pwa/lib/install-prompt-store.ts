export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Listener = () => void;

// Chrome fires `beforeinstallprompt` once, soon after the page loads, which is usually before the passport mounts: the
// layout starts capturing it on every page and the install button reads it from here.
let deferredPrompt: BeforeInstallPromptEvent | null = null;

const listeners = new Set<Listener>();

export function startCapturingInstallPrompt(): () => void {
  window.addEventListener("beforeinstallprompt", captureEvent);
  window.addEventListener("appinstalled", forgetEvent);

  return () => {
    window.removeEventListener("beforeinstallprompt", captureEvent);
    window.removeEventListener("appinstalled", forgetEvent);
  };
}

export function subscribeInstallPrompt(listener: Listener): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function hasInstallPrompt(): boolean {
  return deferredPrompt !== null;
}

/** Shows the browser's own install dialog. The event works once, so it is forgotten after the answer. */
export async function promptInstall(): Promise<void> {
  const event = deferredPrompt;

  if (!event) return;

  await event.prompt();
  await event.userChoice;
  forgetEvent();
}

// A function declaration, so the listener added and removed is always the same one.
function captureEvent(event: Event): void {
  event.preventDefault();
  deferredPrompt = isInstallPromptEvent(event) ? event : null;
  notify();
}

function forgetEvent(): void {
  deferredPrompt = null;
  notify();
}

function notify(): void {
  listeners.forEach((listener) => listener());
}

function isInstallPromptEvent(event: Event): event is BeforeInstallPromptEvent {
  return "prompt" in event && "userChoice" in event;
}
