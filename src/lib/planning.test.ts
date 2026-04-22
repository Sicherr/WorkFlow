import { describe, expect, it } from "vitest";
import type { GoogleCalendarEvent, GoogleCalendarListEntry, GoogleTask, GoogleTaskList } from "../types/google";
import { canEditCalendar, mapEventToPlanningItem, mapTaskToPlanningItem, sortPlanningItems } from "./planning";

describe("planning mapping", () => {
  it("maps Google Tasks to unified planning tasks", () => {
    const list: GoogleTaskList = { id: "list-1", title: "Privat" };
    const task: GoogleTask = {
      id: "task-1",
      title: "Rechnung prüfen",
      notes: "Bis Freitag",
      status: "needsAction",
      due: "2026-04-21T00:00:00.000Z"
    };

    expect(mapTaskToPlanningItem(task, list)).toMatchObject({
      kind: "task",
      id: "task:list-1:task-1",
      title: "Rechnung prüfen",
      dueDate: "2026-04-21"
    });
  });

  it("maps calendar events with edit permissions", () => {
    const calendar: GoogleCalendarListEntry = {
      id: "primary",
      summary: "Kalender",
      accessRole: "writer",
      backgroundColor: "#123456"
    };
    const event: GoogleCalendarEvent = {
      id: "event-1",
      summary: "Review",
      start: { dateTime: "2026-04-21T09:00:00+02:00" },
      end: { dateTime: "2026-04-21T10:00:00+02:00" }
    };

    const item = mapEventToPlanningItem(event, calendar);
    expect(item.canEdit).toBe(true);
    expect(item.date).toBe("2026-04-21");
    expect(item.calendarColor).toBe("#123456");
  });

  it("sorts events before tasks on the same day", () => {
    const task = mapTaskToPlanningItem({ id: "t", title: "Task", due: "2026-04-21T00:00:00.000Z" }, { id: "l", title: "Liste" });
    const event = mapEventToPlanningItem(
      { id: "e", summary: "Termin", start: { dateTime: "2026-04-21T09:00:00+02:00" }, end: { dateTime: "2026-04-21T10:00:00+02:00" } },
      { id: "c", summary: "Kalender", accessRole: "reader" }
    );

    expect(sortPlanningItems([task, event])[0].kind).toBe("event");
    expect(canEditCalendar({ id: "c", summary: "Nur Lesen", accessRole: "reader" })).toBe(false);
  });
});
