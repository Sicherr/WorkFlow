import { useRef, useState, type PointerEvent } from "react";
import { CalendarPlus, Edit3, MapPin } from "lucide-react";
import type { GoogleCalendarListEntry } from "../types/google";
import type { PlanningEvent } from "../types/planning";
import {
  dateKeyToDate,
  formatDayLabel,
  formatTime,
  getWeekDays,
  minutesSinceStartOfDay,
  toDateKey
} from "../lib/dates";

export interface CalendarEventMove {
  date: string;
  start: string;
  end: string;
}

interface CalendarSectionProps {
  weekStart: Date;
  events: PlanningEvent[];
  calendars: GoogleCalendarListEntry[];
  visibleCalendarIds: string[] | null;
  totalEventCount: number;
  visibleCalendarCount: number;
  calendarCount: number;
  onShowAllCalendars: () => void;
  onCalendarVisibilityChange: (calendarId: string) => void;
  isReadOnly: boolean;
  onAddEvent: () => void;
  onEditEvent: (event: PlanningEvent) => void;
  onMoveEvent: (event: PlanningEvent, move: CalendarEventMove) => void;
}

interface DragState {
  event: PlanningEvent;
  pointerId: number;
  offsetY: number;
  previewDate: string | null;
  startMinute: number;
  durationMinutes: number;
  valid: boolean;
}

interface PositionedEvent {
  event: PlanningEvent;
  index: number;
  column: number;
  columns: number;
}

const HOUR_HEIGHT = 72;
const SNAP_MINUTES = 15;
const MINUTES_IN_DAY = 24 * 60;
const hours = Array.from({ length: 24 }, (_, index) => index);

export function CalendarSection({
  weekStart,
  events,
  calendars,
  visibleCalendarIds,
  totalEventCount,
  visibleCalendarCount,
  calendarCount,
  onShowAllCalendars,
  onCalendarVisibilityChange,
  isReadOnly,
  onAddEvent,
  onEditEvent,
  onMoveEvent
}: CalendarSectionProps) {
  const days = getWeekDays(weekStart);
  const activeCalendarIds = visibleCalendarIds ?? calendars.map((calendar) => calendar.id);
  const dayColumnRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [drag, setDrag] = useState<DragState | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  function startDrag(event: PlanningEvent, pointerEvent: PointerEvent<HTMLElement>) {
    if (isReadOnly) return;
    if (!event.canEdit) return;
    if (event.allDay) {
      setWarning("Ganztägige Termine können über Bearbeiten verschoben werden.");
      return;
    }

    pointerEvent.currentTarget.setPointerCapture(pointerEvent.pointerId);
    const rect = pointerEvent.currentTarget.getBoundingClientRect();
    const base: DragState = {
      event,
      pointerId: pointerEvent.pointerId,
      offsetY: pointerEvent.clientY - rect.top,
      previewDate: event.date,
      startMinute: minutesSinceStartOfDay(event.start),
      durationMinutes: actualDurationMinutes(event),
      valid: true
    };

    setWarning(null);
    setDrag(buildDragState(base, pointerEvent.clientX, pointerEvent.clientY));
  }

  function updateDrag(pointerEvent: PointerEvent<HTMLElement>) {
    setDrag((current) => {
      if (!current || current.pointerId !== pointerEvent.pointerId) return current;
      return buildDragState(current, pointerEvent.clientX, pointerEvent.clientY);
    });
  }

  function finishDrag(pointerEvent: PointerEvent<HTMLElement>) {
    if (!drag || drag.pointerId !== pointerEvent.pointerId) return;
    pointerEvent.currentTarget.releasePointerCapture(pointerEvent.pointerId);

    if (!drag.previewDate) {
      setWarning("Der Termin wurde außerhalb des gültigen Kalenderbereichs losgelassen.");
      setDrag(null);
      return;
    }

    if (!drag.valid) {
      setWarning("Der Termin kann nicht über Mitternacht hinaus in diesem Raster abgelegt werden.");
      setDrag(null);
      return;
    }

    onMoveEvent(drag.event, {
      date: drag.previewDate,
      start: isoFromDateAndMinute(drag.previewDate, drag.startMinute),
      end: isoFromDateAndMinute(drag.previewDate, drag.startMinute + drag.durationMinutes)
    });
    setDrag(null);
  }

  function buildDragState(base: DragState, clientX: number, clientY: number): DragState {
    const previewDate = getDateFromPoint(clientX);
    if (!previewDate) return { ...base, previewDate: null, valid: false };

    const column = dayColumnRefs.current[previewDate];
    if (!column) return { ...base, previewDate: null, valid: false };

    const rect = column.getBoundingClientRect();
    const rawMinute = ((clientY - rect.top - base.offsetY) / HOUR_HEIGHT) * 60;
    const startMinute = snapMinute(Math.max(0, Math.min(MINUTES_IN_DAY - SNAP_MINUTES, rawMinute)));
    const crossesMidnight = startMinute + base.durationMinutes > MINUTES_IN_DAY;

    return {
      ...base,
      previewDate,
      startMinute,
      valid: !crossesMidnight
    };
  }

  function getDateFromPoint(clientX: number): string | null {
    for (const [dateKey, element] of Object.entries(dayColumnRefs.current)) {
      if (!element) continue;
      const rect = element.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right) return dateKey;
    }
    return null;
  }

  return (
    <section className="relative flex h-full min-w-0 flex-col bg-white pb-20 lg:pb-0">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-4 sm:px-6 sm:py-5">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-primary-dark">Calendar</p>
          <h2 className="mt-1 text-2xl font-semibold leading-8 text-primary-dark sm:text-[28px] sm:leading-9">
            {formatDayLabel(days[0])} - {formatDayLabel(days[6])}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {events.length} von {totalEventCount} Terminen sichtbar · {visibleCalendarCount}/{calendarCount} Kalender aktiv
          </p>
        </div>
        <div className="grid w-full gap-2 lg:hidden">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Kalender einblenden</p>
          <div className="thin-scrollbar flex gap-2 overflow-x-auto pb-1">
            {calendars.map((calendar) => {
              const active = activeCalendarIds.includes(calendar.id);
              return (
                <button
                  key={calendar.id}
                  type="button"
                  onClick={() => onCalendarVisibilityChange(calendar.id)}
                  className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3 text-sm font-medium ${
                    active ? "border-primary-dark bg-blue-50 text-primary-dark" : "border-outline-soft bg-white text-muted"
                  }`}
                >
                  <span className="h-2.5 w-2.5 rounded" style={{ backgroundColor: calendar.backgroundColor ?? "#0078d4" }} />
                  {calendar.summary}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <button
            type="button"
            onClick={onShowAllCalendars}
            className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-outline-soft bg-white px-4 font-medium hover:bg-surface-low sm:flex-none"
          >
            Alle Kalender
          </button>
          <button
            type="button"
            onClick={onAddEvent}
            disabled={isReadOnly}
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-primary-dark px-4 font-medium text-white shadow-sm hover:bg-primary-blue disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
          >
            <CalendarPlus className="h-4 w-4" />
            Termin hinzufügen
          </button>
        </div>
      </header>

      {warning && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 sm:px-6">
          {warning}
        </div>
      )}

      <div className="thin-scrollbar min-h-0 flex-1 overflow-auto">
        <div className="calendar-grid grid min-w-[760px] sm:min-w-[840px]">
          <div className="sticky top-0 z-20 h-[72px] border-b border-r border-line bg-white" />
          {days.map((day) => {
            const isToday = toDateKey(day) === toDateKey(new Date());
            return (
              <div
                key={day.toISOString()}
                className={`sticky top-0 z-20 flex h-[72px] flex-col items-center justify-center border-b border-r border-line bg-white ${
                  isToday ? "bg-blue-50" : ""
                }`}
              >
                <span className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${isToday ? "text-primary-dark" : "text-muted"}`}>
                  {new Intl.DateTimeFormat("de-DE", { weekday: "short" }).format(day)}
                </span>
                <span className={`text-xl font-semibold ${isToday ? "text-primary-dark" : "text-ink"}`}>{day.getDate()}</span>
              </div>
            );
          })}

          <div className="border-r border-line bg-white">
            {hours.map((hour) => (
              <div key={hour} className="h-[72px] border-b border-line/70 pt-2 text-center text-[11px] font-medium text-muted">
                {String(hour).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {days.map((day) => {
            const dateKey = toDateKey(day);
            const dayEvents = events.filter((event) => event.date === dateKey);
            const positionedEvents = layoutOverlappingEvents(dayEvents);
            const isDropTarget = drag?.previewDate === dateKey;
            return (
              <div
                key={dateKey}
                ref={(element) => {
                  dayColumnRefs.current[dateKey] = element;
                }}
                className={`relative h-[1728px] border-r border-line/80 bg-white transition-colors ${
                  isDropTarget ? (drag?.valid ? "bg-blue-50/60" : "bg-red-50/70") : ""
                }`}
              >
                {hours.map((hour) => (
                  <div key={hour} className="h-[72px] border-b border-line/70" />
                ))}
                {positionedEvents.map(({ event, index, column, columns }) => (
                  <EventBlock
                    key={event.id}
                    event={event}
                    index={index}
                    column={column}
                    columns={columns}
                    isDragging={drag?.event.id === event.id}
                    isReadOnly={isReadOnly}
                    onEditEvent={onEditEvent}
                    onDragStart={startDrag}
                    onDragMove={updateDrag}
                    onDragEnd={finishDrag}
                  />
                ))}
                {drag?.previewDate === dateKey && (
                  <DragPreview
                    title={drag.event.title}
                    startMinute={drag.startMinute}
                    durationMinutes={drag.durationMinutes}
                    valid={drag.valid}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={onAddEvent}
        disabled={isReadOnly}
        className="absolute bottom-24 right-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary-blue text-white shadow-floating transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 lg:bottom-7 lg:right-7"
        aria-label="Termin hinzufügen"
      >
        <CalendarPlus className="h-6 w-6" />
      </button>
    </section>
  );
}

function EventBlock({
  event,
  index,
  column,
  columns,
  isDragging,
  isReadOnly,
  onEditEvent,
  onDragStart,
  onDragMove,
  onDragEnd
}: {
  event: PlanningEvent;
  index: number;
  column: number;
  columns: number;
  isDragging: boolean;
  isReadOnly: boolean;
  onEditEvent: (event: PlanningEvent) => void;
  onDragStart: (event: PlanningEvent, pointerEvent: PointerEvent<HTMLElement>) => void;
  onDragMove: (pointerEvent: PointerEvent<HTMLElement>) => void;
  onDragEnd: (pointerEvent: PointerEvent<HTMLElement>) => void;
}) {
  const startMinute = event.allDay ? 0 : minutesSinceStartOfDay(event.start);
  const top = minuteToY(startMinute);
  const height = event.allDay ? 44 : Math.max(44, minuteToY(actualDurationMinutes(event)));
  const accent = event.calendarColor || "#0078d4";
  const palette = index % 3 === 1 ? "bg-emerald-50 text-emerald-950" : index % 3 === 2 ? "bg-amber-50 text-amber-950" : "bg-blue-50 text-blue-950";
  const gutter = 4;
  const left = `calc(${(column / columns) * 100}% + ${gutter / 2}px)`;
  const width = `calc(${100 / columns}% - ${gutter}px)`;
  const canEdit = event.canEdit && !isReadOnly;
  const canDrag = canEdit && !event.allDay;

  return (
    <article
      onPointerDown={(pointerEvent) => {
        if (canDrag) onDragStart(event, pointerEvent);
      }}
      onPointerMove={onDragMove}
      onPointerUp={onDragEnd}
      onPointerCancel={onDragEnd}
      className={`absolute overflow-hidden rounded border border-line p-2 shadow-sm transition ${
        canDrag ? "cursor-grab touch-none hover:shadow-panel active:cursor-grabbing" : "cursor-default"
      } ${isDragging ? "opacity-30" : "opacity-100"} ${palette}`}
      style={{ top, left, width, minHeight: height, borderLeftWidth: 4, borderLeftColor: accent }}
      title={event.allDay ? "Ganztägige Termine können über Bearbeiten verschoben werden." : undefined}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0">
          <p className="text-[11px] font-bold">
            {event.allDay ? "Ganztägig" : `${formatTime(event.start)} - ${formatTime(event.end)}`}
          </p>
          <p className="mt-1 truncate text-sm font-semibold">{event.title}</p>
          {event.location && (
            <p className="mt-1 flex items-center gap-1 truncate text-[11px]">
              <MapPin className="h-3 w-3" />
              {event.location}
            </p>
          )}
        </div>
        <button
          type="button"
          onPointerDown={(pointerEvent) => pointerEvent.stopPropagation()}
          onClick={() => onEditEvent(event)}
          disabled={!canEdit}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded bg-white/80 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Termin bearbeiten"
        >
          <Edit3 className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  );
}

function DragPreview({
  title,
  startMinute,
  durationMinutes,
  valid
}: {
  title: string;
  startMinute: number;
  durationMinutes: number;
  valid: boolean;
}) {
  const label = `${timeLabel(startMinute)} - ${timeLabel(startMinute + durationMinutes)}`;
  return (
    <div
      className={`pointer-events-none absolute left-1 right-1 z-30 rounded border-2 border-dashed p-2 shadow-floating ${
        valid ? "border-primary-dark bg-blue-100/80 text-blue-950" : "border-red-500 bg-red-100/85 text-red-950"
      }`}
      style={{ top: minuteToY(startMinute), minHeight: Math.max(44, minuteToY(durationMinutes)) }}
    >
      <p className="text-[11px] font-bold">{label}</p>
      <p className="truncate text-sm font-semibold">{title}</p>
      {!valid && <p className="mt-1 text-[11px] font-semibold">Ungültige Position</p>}
    </div>
  );
}

function layoutOverlappingEvents(events: PlanningEvent[]): PositionedEvent[] {
  const sorted = events
    .map((event, index) => ({
      event,
      index,
      start: event.allDay ? 0 : minutesSinceStartOfDay(event.start),
      end: event.allDay ? MINUTES_IN_DAY : minutesSinceStartOfDay(event.start) + actualDurationMinutes(event)
    }))
    .sort((a, b) => a.start - b.start || b.end - a.end || a.event.title.localeCompare(b.event.title, "de"));

  const positioned: PositionedEvent[] = [];
  let group: typeof sorted = [];
  let groupEnd = -1;

  function flushGroup() {
    if (!group.length) return;

    const columnEnds: number[] = [];
    const assignments = group.map((item) => {
      let column = columnEnds.findIndex((end) => item.start >= end);
      if (column === -1) {
        column = columnEnds.length;
        columnEnds.push(item.end);
      } else {
        columnEnds[column] = item.end;
      }
      return { item, column };
    });

    const columns = Math.max(1, columnEnds.length);
    assignments.forEach(({ item, column }) => {
      positioned.push({ event: item.event, index: item.index, column, columns });
    });
    group = [];
    groupEnd = -1;
  }

  sorted.forEach((item) => {
    if (!group.length || item.start < groupEnd) {
      group.push(item);
      groupEnd = Math.max(groupEnd, item.end);
      return;
    }

    flushGroup();
    group.push(item);
    groupEnd = item.end;
  });

  flushGroup();
  return positioned;
}

function actualDurationMinutes(event: PlanningEvent): number {
  return Math.max(15, Math.round((new Date(event.end).getTime() - new Date(event.start).getTime()) / 60000));
}

function snapMinute(value: number): number {
  return Math.round(value / SNAP_MINUTES) * SNAP_MINUTES;
}

function minuteToY(minute: number): number {
  return (minute / 60) * HOUR_HEIGHT;
}

function isoFromDateAndMinute(dateKey: string, minute: number): string {
  const date = dateKeyToDate(dateKey);
  date.setMinutes(minute, 0, 0);
  return date.toISOString();
}

function timeLabel(minute: number): string {
  const normalized = ((minute % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY;
  const hour = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
