import "server-only";
import { Prisma } from "@generated/prisma/client";

/** A unique key or primary key was repeated (Prisma code P2002). */
export function isUniqueViolation(cause: unknown): boolean {
  return cause instanceof Prisma.PrismaClientKnownRequestError && cause.code === "P2002";
}

/**
 * The text of a failure. A trigger that aborts with `RAISE(ABORT, ...)` reaches Prisma as a foreign key error (P2003)
 * whose generic message hides the text of the trigger, so it is read from the driver error in the meta.
 */
export function readDatabaseMessage(cause: unknown): string {
  if (cause instanceof Prisma.PrismaClientKnownRequestError) {
    return readAdapterMessage(cause) || cause.message;
  }

  return cause instanceof Error ? cause.message : "";
}

interface AdapterFailure {
  cause: { originalMessage: string };
}

function readAdapterMessage(error: Prisma.PrismaClientKnownRequestError): string {
  const adapterError = error.meta?.driverAdapterError;

  return isAdapterFailure(adapterError) ? adapterError.cause.originalMessage : "";
}

function isAdapterFailure(value: unknown): value is AdapterFailure {
  return (
    typeof value === "object" &&
    value !== null &&
    "cause" in value &&
    typeof value.cause === "object" &&
    value.cause !== null &&
    "originalMessage" in value.cause &&
    typeof value.cause.originalMessage === "string"
  );
}
