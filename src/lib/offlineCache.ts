import type { PlanningData } from "../types/planning";

export const OFFLINE_PLANNING_CACHE_VERSION = 1;

const CACHE_PREFIX = `planning-cache:v${OFFLINE_PLANNING_CACHE_VERSION}`;
const SNAPSHOT_PREFIX = `${CACHE_PREFIX}:week:`;
const LAST_SNAPSHOT_KEY = `${CACHE_PREFIX}:last`;

export interface OfflinePlanningSnapshot {
  version: number;
  weekStartKey: string;
  savedAt: string;
  data: PlanningData;
}

export function savePlanningSnapshot(weekStartKey: string, data: PlanningData): OfflinePlanningSnapshot | null {
  const storage = getStorage();
  if (!storage) return null;

  const snapshot: OfflinePlanningSnapshot = {
    version: OFFLINE_PLANNING_CACHE_VERSION,
    weekStartKey,
    savedAt: new Date().toISOString(),
    data
  };

  try {
    storage.setItem(snapshotKey(weekStartKey), JSON.stringify(snapshot));
    storage.setItem(LAST_SNAPSHOT_KEY, weekStartKey);
    return snapshot;
  } catch {
    return null;
  }
}

export function loadPlanningSnapshot(weekStartKey: string): OfflinePlanningSnapshot | null {
  const storage = getStorage();
  if (!storage) return null;
  return parseSnapshot(storage.getItem(snapshotKey(weekStartKey)));
}

export function loadLastPlanningSnapshot(): OfflinePlanningSnapshot | null {
  const storage = getStorage();
  if (!storage) return null;

  try {
    const lastWeekStartKey = storage.getItem(LAST_SNAPSHOT_KEY);
    return lastWeekStartKey ? loadPlanningSnapshot(lastWeekStartKey) : null;
  } catch {
    return null;
  }
}

export function clearPlanningSnapshots(): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    for (let index = storage.length - 1; index >= 0; index -= 1) {
      const key = storage.key(index);
      if (key?.startsWith(CACHE_PREFIX)) storage.removeItem(key);
    }
  } catch {
    // Offline cache is best-effort and must never block sign-out.
  }
}

function snapshotKey(weekStartKey: string): string {
  return `${SNAPSHOT_PREFIX}${weekStartKey}`;
}

function parseSnapshot(value: string | null): OfflinePlanningSnapshot | null {
  if (!value) return null;

  try {
    const snapshot = JSON.parse(value) as Partial<OfflinePlanningSnapshot>;
    if (snapshot.version !== OFFLINE_PLANNING_CACHE_VERSION) return null;
    if (!snapshot.weekStartKey || !snapshot.savedAt || !snapshot.data) return null;
    if (!Array.isArray(snapshot.data.taskLists) || !Array.isArray(snapshot.data.calendars)) return null;
    if (!Array.isArray(snapshot.data.tasks) || !Array.isArray(snapshot.data.events)) return null;
    return snapshot as OfflinePlanningSnapshot;
  } catch {
    return null;
  }
}

function getStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}
