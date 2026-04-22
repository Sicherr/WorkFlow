import { afterEach, describe, expect, it } from "vitest";
import type { PlanningData } from "../types/planning";
import {
  OFFLINE_PLANNING_CACHE_VERSION,
  clearPlanningSnapshots,
  loadLastPlanningSnapshot,
  loadPlanningSnapshot,
  savePlanningSnapshot
} from "./offlineCache";

const data: PlanningData = {
  taskLists: [{ id: "tasks", title: "Aufgaben" }],
  calendars: [{ id: "calendar", summary: "Kalender", accessRole: "writer" }],
  tasks: [
    {
      kind: "task",
      id: "task:tasks:t1",
      sourceId: "t1",
      taskListId: "tasks",
      taskListTitle: "Aufgaben",
      title: "Offline lesen",
      notes: "",
      status: "needsAction",
      dueDate: "2026-04-20",
      completedAt: null,
      raw: { id: "t1" }
    }
  ],
  events: [],
  items: []
};

describe("offline planning cache", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("stores and loads a weekly planning snapshot", () => {
    const snapshot = savePlanningSnapshot("2026-04-20", data);

    expect(snapshot?.version).toBe(OFFLINE_PLANNING_CACHE_VERSION);
    expect(loadPlanningSnapshot("2026-04-20")?.data.tasks[0].title).toBe("Offline lesen");
  });

  it("loads the most recent weekly snapshot as fallback", () => {
    savePlanningSnapshot("2026-04-13", { ...data, tasks: [] });
    savePlanningSnapshot("2026-04-20", data);

    expect(loadLastPlanningSnapshot()?.weekStartKey).toBe("2026-04-20");
  });

  it("ignores broken or outdated snapshots", () => {
    localStorage.setItem("planning-cache:v1:week:2026-04-20", "{broken");
    localStorage.setItem(
      "planning-cache:v1:week:2026-04-27",
      JSON.stringify({ version: 0, weekStartKey: "2026-04-27", savedAt: new Date().toISOString(), data })
    );

    expect(loadPlanningSnapshot("2026-04-20")).toBeNull();
    expect(loadPlanningSnapshot("2026-04-27")).toBeNull();
  });

  it("clears all stored snapshots and pointers", () => {
    savePlanningSnapshot("2026-04-20", data);

    clearPlanningSnapshots();

    expect(loadPlanningSnapshot("2026-04-20")).toBeNull();
    expect(loadLastPlanningSnapshot()).toBeNull();
  });
});
