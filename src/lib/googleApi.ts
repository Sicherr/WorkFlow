import type {
  GoogleCalendarEvent,
  GoogleCalendarListEntry,
  GoogleListResponse,
  GoogleTask,
  GoogleTaskList
} from "../types/google";
import type { EventDraft, PlanningData, TaskDraft } from "../types/planning";
import { addDays, dateTimeFromInputs, makeTaskDueIso } from "./dates";
import { mapEventToPlanningItem, mapTaskToPlanningItem, sortPlanningItems } from "./planning";

const TASKS_BASE = "https://tasks.googleapis.com/tasks/v1";
const CALENDAR_BASE = "https://www.googleapis.com/calendar/v3";

export class GoogleApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

function withParams(url: string, params: Record<string, string | number | boolean | undefined>): string {
  const next = new URL(url);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) next.searchParams.set(key, String(value));
  });
  return next.toString();
}

async function fetchGoogle<T>(token: string, url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers
    }
  });

  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => undefined);

  if (!response.ok) {
    const message = body?.error?.message ?? body?.error_description ?? "Google API Anfrage fehlgeschlagen.";
    throw new GoogleApiError(message, response.status);
  }

  return body as T;
}

async function listPaged<T>(token: string, url: string): Promise<T[]> {
  const items: T[] = [];
  let pageToken: string | undefined;

  do {
    const response: GoogleListResponse<T> = await fetchGoogle(token, withParams(url, { pageToken }));
    items.push(...(response.items ?? []));
    pageToken = response.nextPageToken;
  } while (pageToken);

  return items;
}

export async function listTaskLists(token: string): Promise<GoogleTaskList[]> {
  return listPaged<GoogleTaskList>(
    token,
    withParams(`${TASKS_BASE}/users/@me/lists`, {
      maxResults: 1000
    })
  );
}

export async function listTasks(token: string, taskListId: string): Promise<GoogleTask[]> {
  return listPaged<GoogleTask>(
    token,
    withParams(`${TASKS_BASE}/lists/${encodeURIComponent(taskListId)}/tasks`, {
      maxResults: 100,
      showCompleted: true,
      showDeleted: false,
      showHidden: true
    })
  );
}

export async function listCalendars(token: string): Promise<GoogleCalendarListEntry[]> {
  const calendars = await listPaged<GoogleCalendarListEntry>(
    token,
    withParams(`${CALENDAR_BASE}/users/me/calendarList`, {
      maxResults: 250,
      showDeleted: false,
      showHidden: true
    })
  );
  return calendars.filter((calendar) => calendar.accessRole !== "none" && calendar.accessRole !== "freeBusyReader");
}

export async function listEvents(
  token: string,
  calendarId: string,
  weekStart: Date
): Promise<GoogleCalendarEvent[]> {
  return listPaged<GoogleCalendarEvent>(
    token,
    withParams(`${CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events`, {
      maxResults: 250,
      singleEvents: true,
      orderBy: "startTime",
      showDeleted: false,
      timeMin: weekStart.toISOString(),
      timeMax: addDays(weekStart, 7).toISOString()
    })
  ).then((events) => events.filter((event) => event.status !== "cancelled"));
}

export async function loadPlanningData(token: string, weekStart: Date): Promise<PlanningData> {
  const [taskLists, calendars] = await Promise.all([listTaskLists(token), listCalendars(token)]);

  const taskResults = await Promise.allSettled(
    taskLists.map(async (taskList) => {
      const tasks = await listTasks(token, taskList.id);
      return tasks.map((task) => mapTaskToPlanningItem(task, taskList));
    })
  );

  const eventResults = await Promise.allSettled(
    calendars.map(async (calendar) => {
      const events = await listEvents(token, calendar.id, weekStart);
      return events.map((event) => mapEventToPlanningItem(event, calendar));
    })
  );

  const tasks = taskResults.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
  const events = eventResults.flatMap((result) => (result.status === "fulfilled" ? result.value : []));

  return {
    taskLists,
    calendars,
    tasks,
    events,
    items: sortPlanningItems([...tasks, ...events])
  };
}

export async function createTask(token: string, draft: TaskDraft): Promise<GoogleTask> {
  const task = await fetchGoogle<GoogleTask>(
    token,
    `${TASKS_BASE}/lists/${encodeURIComponent(draft.taskListId)}/tasks`,
    {
      method: "POST",
      body: JSON.stringify({
        title: draft.title,
        notes: draft.notes || undefined,
        due: draft.dueDate ? makeTaskDueIso(draft.dueDate) : undefined
      })
    }
  );
  return task;
}

export async function updateTask(
  token: string,
  taskListId: string,
  taskId: string,
  body: Partial<Pick<GoogleTask, "title" | "notes" | "due" | "status">> & { completed?: string | null }
): Promise<GoogleTask> {
  return fetchGoogle<GoogleTask>(token, `${TASKS_BASE}/lists/${encodeURIComponent(taskListId)}/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(body)
  });
}

export async function moveTaskToList(
  token: string,
  sourceTaskListId: string,
  taskId: string,
  destinationTaskListId: string
): Promise<GoogleTask> {
  return fetchGoogle<GoogleTask>(
    token,
    withParams(`${TASKS_BASE}/lists/${encodeURIComponent(sourceTaskListId)}/tasks/${encodeURIComponent(taskId)}/move`, {
      destinationTasklist: destinationTaskListId
    }),
    {
      method: "POST"
    }
  );
}

export async function createEvent(token: string, draft: EventDraft): Promise<GoogleCalendarEvent> {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return fetchGoogle<GoogleCalendarEvent>(
    token,
    `${CALENDAR_BASE}/calendars/${encodeURIComponent(draft.calendarId)}/events`,
    {
      method: "POST",
      body: JSON.stringify({
        summary: draft.title,
        description: draft.description || undefined,
        location: draft.location || undefined,
        start: { dateTime: dateTimeFromInputs(draft.date, draft.startTime), timeZone },
        end: { dateTime: dateTimeFromInputs(draft.date, draft.endTime), timeZone }
      })
    }
  );
}

export async function updateEvent(
  token: string,
  calendarId: string,
  eventId: string,
  body: Partial<GoogleCalendarEvent>
): Promise<GoogleCalendarEvent> {
  return fetchGoogle<GoogleCalendarEvent>(
    token,
    `${CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    {
      method: "PATCH",
      body: JSON.stringify(body)
    }
  );
}
