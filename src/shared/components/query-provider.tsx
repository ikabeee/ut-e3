"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { ReactNode } from "react";
import { getQueryClient } from "@/shared/lib/query/get-query-client";

export function QueryProvider({ children }: { children: ReactNode }) {
  // Do not use useState here: without a Suspense boundary above, React could
  // discard the client during the initial render.
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Rendered only in development; it is excluded from production builds. */}
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
    </QueryClientProvider>
  );
}
