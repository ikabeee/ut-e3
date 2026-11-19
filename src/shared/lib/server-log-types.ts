/** The levels and sources of a server log (S4); the CHECKs of the `server_logs` migration list the same values. */
export const SERVER_LOG_LEVELS = ["error", "warn", "info"] as const;

export const SERVER_LOG_SOURCES = ["request", "email", "overload", "emergency", "worker", "console"] as const;

export type ServerLogLevel = (typeof SERVER_LOG_LEVELS)[number];

export type ServerLogSource = (typeof SERVER_LOG_SOURCES)[number];
