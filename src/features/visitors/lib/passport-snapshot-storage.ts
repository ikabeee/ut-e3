import {
  createSnapshot,
  PASSPORT_SNAPSHOT_KEY,
  serializeSnapshot,
  type PassportSnapshot,
} from "@features/visitors/lib/passport-snapshot";

type SnapshotInput = Parameters<typeof createSnapshot>[0];

// localStorage can be missing or throw (private windows, blocked storage): the passport then works as always, just
// without the offline copy.

export function savePassportSnapshot(input: SnapshotInput): PassportSnapshot | null {
  const snapshot = createSnapshot(input);

  try {
    window.localStorage.setItem(PASSPORT_SNAPSHOT_KEY, serializeSnapshot(snapshot));

    return snapshot;
  } catch {
    return null;
  }
}

/** Deletes the copy: the device was replaced (RF-18) or the passport belongs to someone else now. */
export function clearPassportSnapshot(): void {
  try {
    window.localStorage.removeItem(PASSPORT_SNAPSHOT_KEY);
  } catch {
    // Nothing to delete if the storage cannot be read.
  }
}

export function readRawPassportSnapshot(): string | null {
  try {
    return window.localStorage.getItem(PASSPORT_SNAPSHOT_KEY);
  } catch {
    return null;
  }
}
