import type {
  CalendarAccessRole,
  GoogleCalendarEvent,
  GoogleCalendarListEntry,
  GoogleTask,
  GoogleTaskList
} from "./google";

export type ItemFilter = "all" | "tasks" | "events";

export interface PlanningTask {
  kind: "task";
  id: string;
  sourceId: string;
  taskListId: string;
  taskListTitle: string;
  title: string;
  notes: string;
  status: "needsAction" | "completed";
  dueDate: string | null;
  completedAt: string | null;
  webViewLink?: string;
  raw: GoogleTask;
}

export interface PlanningEvent {
  kind: "event";
  id: string;
  sourceId: string;
  calendarId: string;
  calendarTitle: string;
  calendarColor: string;
  accessRole: CalendarAccessRole;
  canEdit: boolean;
  title: string;
  description: string;
  location: string;
  start: string;
  end: string;
  date: string;
  allDay: boolean;
  colorId?: string;
  htmlLink?: string;
  raw: GoogleCalendarEvent;
}

export type PlanningItem = PlanningTask | PlanningEvent;

export interface PlanningData {
  taskLists: GoogleTaskList[];
  calendars: GoogleCalendarListEntry[];
  tasks: PlanningTask[];
  events: PlanningEvent[];
  items: PlanningItem[];
}

export interface TaskDraft {
  title: string;
  notes: string;
  dueDate: string;
  taskListId: string;
}

export interface EventDraft {
  title: string;
  description: string;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  calendarId: string;
}
