import {
  defaultShouldDehydrateQuery,
  environmentManager,
  QueryClient,
} from "@tanstack/react-query";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, keep a staleTime above 0 so the client does not refetch
        // immediately the data that was already prefetched on the server.
        staleTime: 60 * 1000,
      },
      dehydrate: {
        // Also dehydrate pending queries so a prefetch can stream to the client.
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === "pending",
        // Let Next.js handle server errors instead of redacting them here.
        shouldRedactErrors: () => false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/**
 * Server: a new QueryClient per request, so data is never shared between users.
 * Browser: a single QueryClient reused across renders.
 */
export function getQueryClient() {
  if (environmentManager.isServer()) {
    return makeQueryClient();
  }

  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
