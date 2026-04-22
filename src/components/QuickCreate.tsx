import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarPlus, ListPlus } from "lucide-react";
import type { GoogleCalendarListEntry, GoogleTaskList } from "../types/google";
import type { EventDraft, TaskDraft } from "../types/planning";
import { dateKeyToDate, toDateKey } from "../lib/dates";
import { canEditCalendar } from "../lib/planning";

interface QuickCreateProps {
  taskLists: GoogleTaskList[];
  calendars: GoogleCalendarListEntry[];
  isBusy: boolean;
  onCreateTask: (draft: TaskDraft) => void;
  onCreateEvent: (draft: EventDraft) => void;
}

export function QuickCreate({ taskLists, calendars, isBusy, onCreateTask, onCreateEvent }: QuickCreateProps) {
  const [mode, setMode] = useState<"task" | "event">("task");
  const today = toDateKey(new Date());
  const writableCalendars = useMemo(() => calendars.filter(canEditCalendar), [calendars]);

  const [taskDraft, setTaskDraft] = useState<TaskDraft>({
    title: "",
    notes: "",
    dueDate: today,
    taskListId: ""
  });
  const [eventDraft, setEventDraft] = useState<EventDraft>({
    title: "",
    description: "",
    location: "",
    date: today,
    startTime: "09:00",
    endTime: "10:00",
    calendarId: ""
  });

  useEffect(() => {
    setTaskDraft((draft) => ({ ...draft, taskListId: draft.taskListId || taskLists[0]?.id || "" }));
  }, [taskLists]);

  useEffect(() => {
    setEventDraft((draft) => ({ ...draft, calendarId: draft.calendarId || writableCalendars[0]?.id || "" }));
  }, [writableCalendars]);

  function submitTask(event: FormEvent) {
    event.preventDefault();
    if (!taskDraft.title.trim() || !taskDraft.taskListId) return;
    onCreateTask({ ...taskDraft, title: taskDraft.title.trim() });
    setTaskDraft((draft) => ({ ...draft, title: "", notes: "" }));
  }

  function submitEvent(event: FormEvent) {
    event.preventDefault();
    if (!eventDraft.title.trim() || !eventDraft.calendarId) return;
    onCreateEvent({ ...eventDraft, title: eventDraft.title.trim() });
    const nextDate = toDateKey(dateKeyToDate(eventDraft.date));
    setEventDraft((draft) => ({ ...draft, title: "", description: "", location: "", date: nextDate }));
  }

  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-panel">
      <div className="mb-4 grid grid-cols-2 rounded-md bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setMode("task")}
          className={`inline-flex h-9 items-center justify-center gap-2 rounded text-sm font-medium ${
            mode === "task" ? "bg-white text-task shadow-sm" : "text-muted"
          }`}
        >
          <ListPlus className="h-4 w-4" />
          Task
        </button>
        <button
          type="button"
          onClick={() => setMode("event")}
          className={`inline-flex h-9 items-center justify-center gap-2 rounded text-sm font-medium ${
            mode === "event" ? "bg-white text-event shadow-sm" : "text-muted"
          }`}
        >
          <CalendarPlus className="h-4 w-4" />
          Termin
        </button>
      </div>

      {mode === "task" ? (
        <form className="grid gap-3" onSubmit={submitTask}>
          <input
            value={taskDraft.title}
            onChange={(event) => setTaskDraft((draft) => ({ ...draft, title: event.target.value }))}
            placeholder="Neue Aufgabe"
            className="h-10 rounded-md border border-line px-3"
          />
          <input
            type="date"
            value={taskDraft.dueDate}
            onChange={(event) => setTaskDraft((draft) => ({ ...draft, dueDate: event.target.value }))}
            className="h-10 rounded-md border border-line px-3"
          />
          <select
            value={taskDraft.taskListId}
            onChange={(event) => setTaskDraft((draft) => ({ ...draft, taskListId: event.target.value }))}
            className="h-10 rounded-md border border-line px-3"
          >
            {taskLists.map((list) => (
              <option key={list.id} value={list.id}>
                {list.title}
              </option>
            ))}
          </select>
          <textarea
            value={taskDraft.notes}
            onChange={(event) => setTaskDraft((draft) => ({ ...draft, notes: event.target.value }))}
            placeholder="Beschreibung"
            className="min-h-20 resize-y rounded-md border border-line px-3 py-2"
          />
          <button
            type="submit"
            disabled={isBusy || !taskDraft.title.trim()}
            className="h-10 rounded-md bg-task px-4 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Aufgabe erstellen
          </button>
        </form>
      ) : (
        <form className="grid gap-3" onSubmit={submitEvent}>
          <input
            value={eventDraft.title}
            onChange={(event) => setEventDraft((draft) => ({ ...draft, title: event.target.value }))}
            placeholder="Neuer Termin"
            className="h-10 rounded-md border border-line px-3"
          />
          <div className="grid gap-2 sm:grid-cols-3">
            <input
              type="date"
              value={eventDraft.date}
              onChange={(event) => setEventDraft((draft) => ({ ...draft, date: event.target.value }))}
              className="h-10 rounded-md border border-line px-3"
            />
            <input
              type="time"
              value={eventDraft.startTime}
              onChange={(event) => setEventDraft((draft) => ({ ...draft, startTime: event.target.value }))}
              className="h-10 rounded-md border border-line px-3"
            />
            <input
              type="time"
              value={eventDraft.endTime}
              onChange={(event) => setEventDraft((draft) => ({ ...draft, endTime: event.target.value }))}
              className="h-10 rounded-md border border-line px-3"
            />
          </div>
          <select
            value={eventDraft.calendarId}
            onChange={(event) => setEventDraft((draft) => ({ ...draft, calendarId: event.target.value }))}
            className="h-10 rounded-md border border-line px-3"
          >
            {writableCalendars.map((calendar) => (
              <option key={calendar.id} value={calendar.id}>
                {calendar.summary}
              </option>
            ))}
          </select>
          <input
            value={eventDraft.location}
            onChange={(event) => setEventDraft((draft) => ({ ...draft, location: event.target.value }))}
            placeholder="Ort"
            className="h-10 rounded-md border border-line px-3"
          />
          <textarea
            value={eventDraft.description}
            onChange={(event) => setEventDraft((draft) => ({ ...draft, description: event.target.value }))}
            placeholder="Beschreibung"
            className="min-h-20 resize-y rounded-md border border-line px-3 py-2"
          />
          <button
            type="submit"
            disabled={isBusy || !eventDraft.title.trim() || !writableCalendars.length}
            className="h-10 rounded-md bg-event px-4 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Termin erstellen
          </button>
        </form>
      )}
    </section>
  );
}
