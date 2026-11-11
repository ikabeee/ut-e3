import { useState } from "react";

export type CopyStatus = "idle" | "copied" | "failed";

export function useCopyToClipboard(text: string) {
  const [status, setStatus] = useState<CopyStatus>("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
  }

  return { status, copy };
}
