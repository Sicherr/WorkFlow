import type { GoogleCalendarEvent, GoogleCalendarListEntry, GoogleTask, GoogleTaskList } from "../types/google";
import type { PlanningEvent, PlanningItem, PlanningTask } from "../types/planning";
import { getDateKeyFromGoogleDate } from "./dates";

export function canEditCalendar(calendar: GoogleCalendarListEntry): boolean {
  return calendar.accessRole === "owner" || calendar.accessRole === "writer";
}

export function mapTaskToPlanningItem(task: GoogleTask, taskList: GoogleTaskList): PlanningTask {
  return {
    kind: "task",
    id: `task:${taskList.id}:${task.id}`,
    sourceId: task.id,
    taskListId: taskList.id,
    taskListTitle: taskList.title,
    title: task.title?.trim() || "Unbenannte Aufgabe",
    notes: task.notes ?? "",
    status: task.status ?? "needsAction",
    dueDate: getDateKeyFromGoogleDate(task.due),
    completedAt: task.completed ?? null,
    webViewLink: task.webViewLink,
    raw: task
  };
}

export function mapEventToPlanningItem(event: GoogleCalendarEvent, calendar: GoogleCalendarListEntry): PlanningEvent {
  const allDay = Boolean(event.start?.date);
  const start = event.start?.dateTime ?? event.start?.date;
  const end = event.end?.dateTime ?? event.end?.date ?? start;
  const date = getDateKeyFromGoogleDate(start) ?? getDateKeyFromGoogleDate(end) ?? "";

  return {
    kind: "event",
    id: `event:${calendar.id}:${event.id}`,
    sourceId: event.id,
    calendarId: calendar.id,
    calendarTitle: calendar.summary,
    calendarColor: calendar.backgroundColor ?? "#3159a4",
    accessRole: calendar.accessRole ?? "reader",
    canEdit: canEditCalendar(calendar),
    title: event.summary?.trim() || "Unbenannter Termin",
    description: event.description ?? "",
    location: event.location ?? "",
    start: start ?? "",
    end: end ?? start ?? "",
    date,
    allDay,
    colorId: event.colorId,
    htmlLink: event.htmlLink,
    raw: event
  };
}

export function sortPlanningItems(items: PlanningItem[]): PlanningItem[] {
  return [...items].sort((a, b) => {
    const aDate = a.kind === "task" ? a.dueDate ?? "9999-12-31" : a.date || "9999-12-31";
    const bDate = b.kind === "task" ? b.dueDate ?? "9999-12-31" : b.date || "9999-12-31";
    if (aDate !== bDate) return aDate.localeCompare(bDate);
    if (a.kind !== b.kind) return a.kind === "event" ? -1 : 1;
    if (a.kind === "event" && b.kind === "event" && a.start !== b.start) return a.start.localeCompare(b.start);
    return a.title.localeCompare(b.title, "de");
  });
}
