import { FormEvent, useMemo, useState } from "react";
import { Check, Edit3, MapPin, Save, X } from "lucide-react";
import type { ItemFilter, PlanningEvent, PlanningTask } from "../types/planning";
import {
  dateTimeFromInputs,
  eventDurationMinutes,
  formatDayLabel,
  formatTime,
  getWeekDays,
  minutesSinceStartOfDay,
  timeInputFromIso,
  toDateKey
} from "../lib/dates";

interface WeekTimelineProps {
  weekStart: Date;
  filter: ItemFilter;
  tasks: PlanningTask[];
  events: PlanningEvent[];
  onToggleTask: (task: PlanningTask) => void;
  onUpdateTask: (task: PlanningTask, values: { title: string; notes: string; dueDate: string }) => void;
  onUpdateEvent: (
    event: PlanningEvent,
    values: {
      title: string;
      description: string;
      location: string;
      date: string;
      startTime: string;
      endTime: string;
    }
  ) => void;
}

export function WeekTimeline({
  weekStart,
  filter,
  tasks,
  events,
  onToggleTask,
  onUpdateTask,
  onUpdateEvent
}: WeekTimelineProps) {
  const days = useMemo(() => getWeekDays(weekStart), [weekStart]);

  return (
    <section className="overflow-x-auto rounded-lg border border-line bg-white shadow-panel">
      <div className="timeline-grid grid min-w-[1610px]">
        {days.map((day) => {
          const dateKey = toDateKey(day);
          const dayEvents = filter !== "tasks" ? events.filter((event) => event.date === dateKey) : [];
          const dayTasks =
            filter !== "events"
              ? tasks.filter((task) => task.dueDate === dateKey && task.status !== "completed")
              : [];

          return (
            <article key={dateKey} className="min-h-[720px] border-r border-line last:border-r-0">
              <header className="sticky top-[73px] z-10 border-b border-line bg-white px-3 py-3">
                <p className="text-sm font-semibold uppercase tracking-normal text-muted">{formatDayLabel(day)}</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                  <span className="rounded bg-blue-50 px-2 py-1 text-event">{dayEvents.length} Termine</span>
                  <span className="rounded bg-emerald-50 px-2 py-1 text-task">{dayTasks.length} Tasks</span>
                </div>
              </header>
              <div className="grid gap-3 p-3">
                {dayEvents.map((event) => (
                  <EventCard key={event.id} event={event} onUpdateEvent={onUpdateEvent} />
                ))}
                {dayTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggleTask={onToggleTask}
                    onUpdateTask={onUpdateTask}
                  />
                ))}
                {!dayEvents.length && !dayTasks.length && (
                  <div className="rounded-md border border-dashed border-line px-3 py-8 text-center text-sm text-muted">
                    Keine Einträge
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function TaskCard({
  task,
  onToggleTask,
  onUpdateTask
}: {
  task: PlanningTask;
  onToggleTask: (task: PlanningTask) => void;
  onUpdateTask: (task: PlanningTask, values: { title: string; notes: string; dueDate: string }) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes);
  const [dueDate, setDueDate] = useState(task.dueDate ?? toDateKey(new Date()));

  function submit(event: FormEvent) {
    event.preventDefault();
    onUpdateTask(task, { title: title.trim() || task.title, notes, dueDate });
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <form onSubmit={submit} className="grid gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3">
        <input value={title} onChange={(event) => setTitle(event.target.value)} className="h-9 rounded border px-2" />
        <input
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          className="h-9 rounded border px-2"
        />
        <textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="min-h-20 rounded border p-2" />
        <div className="flex gap-2">
          <button type="submit" className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded bg-task text-white">
            <Save className="h-4 w-4" />
            Speichern
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="inline-flex h-9 w-10 items-center justify-center rounded border border-line bg-white"
            aria-label="Bearbeitung abbrechen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => onToggleTask(task)}
          className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded border border-task bg-white text-task"
          aria-label="Aufgabe abhaken"
        >
          {task.status === "completed" && <Check className="h-4 w-4" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-5 text-task">{task.title}</p>
          <p className="mt-1 text-xs text-muted">{task.taskListTitle}</p>
          {task.notes && <p className="mt-2 whitespace-pre-wrap text-sm leading-5 text-ink">{task.notes}</p>}
        </div>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded border border-line bg-white"
          aria-label="Aufgabe bearbeiten"
        >
          <Edit3 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function EventCard({
  event,
  onUpdateEvent
}: {
  event: PlanningEvent;
  onUpdateEvent: WeekTimelineProps["onUpdateEvent"];
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description);
  const [location, setLocation] = useState(event.location);
  const [date, setDate] = useState(event.date);
  const [startTime, setStartTime] = useState(event.allDay ? "09:00" : timeInputFromIso(event.start));
  const [endTime, setEndTime] = useState(event.allDay ? "10:00" : timeInputFromIso(event.end));
  const top = event.allDay ? 0 : Math.max(0, Math.round((minutesSinceStartOfDay(event.start) / 1440) * 100));
  const height = event.allDay ? 0 : Math.max(4, Math.round((eventDurationMinutes(event.start, event.end) / 1440) * 100));

  function submit(eventSubmit: FormEvent) {
    eventSubmit.preventDefault();
    onUpdateEvent(event, {
      title: title.trim() || event.title,
      description,
      location,
      date,
      startTime,
      endTime
    });
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <form onSubmit={submit} className="grid gap-2 rounded-md border border-blue-200 bg-blue-50 p-3">
        <input value={title} onChange={(input) => setTitle(input.target.value)} className="h-9 rounded border px-2" />
        <div className="grid grid-cols-3 gap-2">
          <input type="date" value={date} onChange={(input) => setDate(input.target.value)} className="h-9 rounded border px-2" />
          <input
            type="time"
            value={startTime}
            onChange={(input) => setStartTime(input.target.value)}
            className="h-9 rounded border px-2"
          />
          <input type="time" value={endTime} onChange={(input) => setEndTime(input.target.value)} className="h-9 rounded border px-2" />
        </div>
        <input value={location} onChange={(input) => setLocation(input.target.value)} placeholder="Ort" className="h-9 rounded border px-2" />
        <textarea
          value={description}
          onChange={(input) => setDescription(input.target.value)}
          className="min-h-20 rounded border p-2"
        />
        <div className="flex gap-2">
          <button type="submit" className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded bg-event text-white">
            <Save className="h-4 w-4" />
            Speichern
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="inline-flex h-9 w-10 items-center justify-center rounded border border-line bg-white"
            aria-label="Bearbeitung abbrechen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="rounded-md border border-blue-200 bg-blue-50 p-3" style={{ borderLeftColor: event.calendarColor, borderLeftWidth: 5 }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-event">
            {event.allDay ? "Ganztägig" : `${formatTime(event.start)} - ${formatTime(event.end)}`}
          </p>
          <p className="mt-1 font-semibold leading-5 text-ink">{event.title}</p>
          <p className="mt-1 text-xs text-muted">{event.calendarTitle}</p>
        </div>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          disabled={!event.canEdit}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded border border-line bg-white disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Termin bearbeiten"
        >
          <Edit3 className="h-4 w-4" />
        </button>
      </div>
      {event.location && (
        <p className="mt-2 flex items-center gap-1 text-sm text-muted">
          <MapPin className="h-4 w-4" />
          {event.location}
        </p>
      )}
      {event.description && <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm leading-5 text-ink">{event.description}</p>}
      {!event.allDay && (
        <div className="mt-3 h-1.5 rounded bg-blue-100">
          <div className="h-1.5 rounded bg-event" style={{ marginLeft: `${top}%`, width: `${Math.min(height, 100 - top)}%` }} />
        </div>
      )}
      {!event.canEdit && <p className="mt-2 text-xs text-muted">Nur lesbar</p>}
    </div>
  );
}

export function makeEventUpdateBody(values: {
  title: string;
  description: string;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
}) {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return {
    summary: values.title,
    description: values.description || undefined,
    location: values.location || undefined,
    start: { dateTime: dateTimeFromInputs(values.date, values.startTime), timeZone },
    end: { dateTime: dateTimeFromInputs(values.date, values.endTime), timeZone }
  };
}
