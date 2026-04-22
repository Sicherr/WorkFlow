import { FormEvent, useEffect, useMemo, useState } from "react";
import type { GoogleCalendarListEntry, GoogleTaskList } from "../types/google";
import type { EventDraft, PlanningEvent, PlanningTask, TaskDraft } from "../types/planning";
import { canEditCalendar } from "../lib/planning";
import { timeInputFromIso, toDateKey } from "../lib/dates";

interface FormActions {
  isBusy: boolean;
  submitLabel: string;
  onCancel: () => void;
}

export function TaskForm({
  task,
  taskLists,
  initialTaskListId,
  isBusy,
  submitLabel,
  onCancel,
  onSubmit
}: FormActions & {
  task?: PlanningTask;
  taskLists: GoogleTaskList[];
  initialTaskListId?: string | null;
  onSubmit: (draft: TaskDraft | { title: string; notes: string; dueDate: string }) => void;
}) {
  const [draft, setDraft] = useState<TaskDraft>({
    title: task?.title ?? "",
    notes: task?.notes ?? "",
    dueDate: task?.dueDate ?? toDateKey(new Date()),
    taskListId: task?.taskListId ?? initialTaskListId ?? ""
  });

  useEffect(() => {
    setDraft((current) => ({ ...current, taskListId: current.taskListId || taskLists[0]?.id || "" }));
  }, [taskLists]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft.title.trim()) return;
    onSubmit({ ...draft, title: draft.title.trim() });
  }

  return (
    <form className="grid gap-3" onSubmit={submit}>
      <label className="grid gap-1 text-sm font-medium">
        Titel
        <input
          value={draft.title}
          onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
          className="h-10 rounded-md border border-line px-3"
          autoFocus
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Fälligkeit
        <input
          type="date"
          value={draft.dueDate}
          onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value }))}
          className="h-10 rounded-md border border-line px-3"
        />
      </label>
      {!task && (
        <label className="grid gap-1 text-sm font-medium">
          Taskliste
          <select
            value={draft.taskListId}
            onChange={(event) => setDraft((current) => ({ ...current, taskListId: event.target.value }))}
            className="h-10 rounded-md border border-line px-3"
          >
            {taskLists.map((list) => (
              <option key={list.id} value={list.id}>
                {list.title}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="grid gap-1 text-sm font-medium">
        Beschreibung
        <textarea
          value={draft.notes}
          onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
          className="min-h-28 resize-y rounded-md border border-line px-3 py-2"
        />
      </label>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="h-10 rounded-md border border-line bg-white px-4 font-medium">
          Abbrechen
        </button>
        <button
          type="submit"
          disabled={isBusy || !draft.title.trim() || (!task && !draft.taskListId)}
          className="h-10 rounded-md bg-task px-4 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

export function EventForm({
  event,
  calendars,
  isBusy,
  submitLabel,
  onCancel,
  onSubmit
}: FormActions & {
  event?: PlanningEvent;
  calendars: GoogleCalendarListEntry[];
  onSubmit: (draft: EventDraft | { title: string; description: string; location: string; date: string; startTime: string; endTime: string }) => void;
}) {
  const writableCalendars = useMemo(() => calendars.filter(canEditCalendar), [calendars]);
  const [draft, setDraft] = useState<EventDraft>({
    title: event?.title ?? "",
    description: event?.description ?? "",
    location: event?.location ?? "",
    date: event?.date ?? toDateKey(new Date()),
    startTime: event ? (event.allDay ? "09:00" : timeInputFromIso(event.start)) : "09:00",
    endTime: event ? (event.allDay ? "10:00" : timeInputFromIso(event.end)) : "10:00",
    calendarId: event?.calendarId ?? ""
  });

  useEffect(() => {
    setDraft((current) => ({ ...current, calendarId: current.calendarId || writableCalendars[0]?.id || "" }));
  }, [writableCalendars]);

  function submit(formEvent: FormEvent) {
    formEvent.preventDefault();
    if (!draft.title.trim()) return;
    onSubmit({ ...draft, title: draft.title.trim() });
  }

  return (
    <form className="grid gap-3" onSubmit={submit}>
      <label className="grid gap-1 text-sm font-medium">
        Titel
        <input
          value={draft.title}
          onChange={(input) => setDraft((current) => ({ ...current, title: input.target.value }))}
          className="h-10 rounded-md border border-line px-3"
          autoFocus
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1 text-sm font-medium">
          Datum
          <input
            type="date"
            value={draft.date}
            onChange={(input) => setDraft((current) => ({ ...current, date: input.target.value }))}
            className="h-10 rounded-md border border-line px-3"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Start
          <input
            type="time"
            value={draft.startTime}
            onChange={(input) => setDraft((current) => ({ ...current, startTime: input.target.value }))}
            className="h-10 rounded-md border border-line px-3"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Ende
          <input
            type="time"
            value={draft.endTime}
            onChange={(input) => setDraft((current) => ({ ...current, endTime: input.target.value }))}
            className="h-10 rounded-md border border-line px-3"
          />
        </label>
      </div>
      {!event && (
        <label className="grid gap-1 text-sm font-medium">
          Kalender
          <select
            value={draft.calendarId}
            onChange={(input) => setDraft((current) => ({ ...current, calendarId: input.target.value }))}
            className="h-10 rounded-md border border-line px-3"
          >
            {writableCalendars.map((calendar) => (
              <option key={calendar.id} value={calendar.id}>
                {calendar.summary}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="grid gap-1 text-sm font-medium">
        Ort
        <input
          value={draft.location}
          onChange={(input) => setDraft((current) => ({ ...current, location: input.target.value }))}
          className="h-10 rounded-md border border-line px-3"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Beschreibung
        <textarea
          value={draft.description}
          onChange={(input) => setDraft((current) => ({ ...current, description: input.target.value }))}
          className="min-h-28 resize-y rounded-md border border-line px-3 py-2"
        />
      </label>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="h-10 rounded-md border border-line bg-white px-4 font-medium">
          Abbrechen
        </button>
        <button
          type="submit"
          disabled={isBusy || !draft.title.trim() || (!event && !draft.calendarId)}
          className="h-10 rounded-md bg-event px-4 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
