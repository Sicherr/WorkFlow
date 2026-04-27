import { useEffect, useMemo, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { CalendarPlus, ChevronLeft, ChevronRight, Edit3, MapPin } from "lucide-react";
import type { GoogleCalendarListEntry } from "../types/google";
import type { EventDraft, PlanningEvent } from "../types/planning";
import {
  dateKeyToDate,
  formatDayLabel,
  formatLongDate,
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

type CalendarViewMode = "week" | "day" | "agenda";

interface CalendarSectionProps {
  weekStart: Date;
  events: PlanningEvent[];
  calendars: GoogleCalendarListEntry[];
  visibleCalendarIds: string[] | null;
  totalEventCount: number;
  visibleCalendarCount: number;
  calendarCount: number;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onShowAllCalendars: () => void;
  onCalendarVisibilityChange: (calendarId: string) => void;
  isReadOnly: boolean;
  onAddEvent: () => void;
  onCreateEventAt: (draft: Partial<EventDraft>) => void;
  onEditEvent: (event: PlanningEvent) => void;
  onMoveEvent: (event: PlanningEvent, move: CalendarEventMove) => void;
  onOpenSidebar: () => void;
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
  onPreviousWeek,
  onNextWeek,
  onToday,
  onShowAllCalendars,
  onCalendarVisibilityChange,
  isReadOnly,
  onAddEvent,
  onCreateEventAt,
  onEditEvent,
  onMoveEvent,
  onOpenSidebar
}: CalendarSectionProps) {
  const days = getWeekDays(weekStart);
  const activeCalendarIds = visibleCalendarIds ?? calendars.map((calendar) => calendar.id);
  const dayColumnRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [drag, setDrag] = useState<DragState | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<CalendarViewMode>("week");
  const [focusedDateKey, setFocusedDateKey] = useState(() => getInitialFocusedDateKey(days));

  useEffect(() => {
    if (!days.some((day) => toDateKey(day) === focusedDateKey)) {
      setFocusedDateKey(getInitialFocusedDateKey(days));
    }
  }, [days, focusedDateKey]);

  const focusedDay = days.find((day) => toDateKey(day) === focusedDateKey) ?? days[0];
  const displayDays = viewMode === "day" ? [focusedDay] : days;
  const isAllCalendarsVisible = calendars.length > 0 && activeCalendarIds.length === calendars.length;
  const sortedEvents = useMemo(
    () =>
      [...events].sort(
        (left, right) =>
          new Date(left.start).getTime() - new Date(right.start).getTime() || left.title.localeCompare(right.title, "de")
      ),
    [events]
  );

  function startDrag(event: PlanningEvent, pointerEvent: PointerEvent<HTMLElement>) {
    if (isReadOnly || viewMode === "agenda") return;
    if (!event.canEdit) return;
    if (event.allDay) {
      setWarning("Ganztagige Termine koennen ueber Bearbeiten verschoben werden.");
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
      setWarning("Der Termin wurde ausserhalb des gueltigen Kalenderbereichs losgelassen.");
      setDrag(null);
      return;
    }

    if (!drag.valid) {
      setWarning("Der Termin kann nicht ueber Mitternacht hinaus in diesem Raster abgelegt werden.");
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

  function handleEmptySlotClick(dateKey: string, event: MouseEvent<HTMLDivElement>) {
    if (isReadOnly || viewMode === "agenda") return;
    const target = event.target as HTMLElement;
    if (target.closest("[data-event-block='true']")) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const rawMinute = ((event.clientY - rect.top) / HOUR_HEIGHT) * 60;
    const startMinute = Math.min(MINUTES_IN_DAY - 60, snapMinute(Math.max(0, rawMinute)));
    const endMinute = startMinute + 60;

    onCreateEventAt({
      date: dateKey,
      startTime: timeLabel(startMinute),
      endTime: timeLabel(endMinute)
    });
  }

  return (
    <section className="relative flex h-full min-w-0 flex-col overflow-y-auto bg-white pb-20 lg:overflow-hidden lg:pb-0">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex min-w-0 items-start gap-3">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-outline-soft bg-white text-primary-dark hover:bg-surface-low lg:hidden"
            aria-label="Navigation oeffnen"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-primary-dark">Calendar</p>
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
          <button
            type="button"
            onClick={onPreviousWeek}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-outline-soft bg-white hover:bg-surface-low"
            aria-label="Vorherige Woche"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex h-10 min-w-0 flex-1 items-center justify-center rounded-lg border border-outline-soft bg-white px-3 text-sm font-medium sm:min-w-44 sm:flex-none sm:text-base">
            {viewMode === "day" ? formatLongDate(focusedDay) : `${formatDayLabel(days[0])} - ${formatDayLabel(days[6])}`}
          </div>
          <button
            type="button"
            onClick={onNextWeek}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-outline-soft bg-white hover:bg-surface-low"
            aria-label="Naechste Woche"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="grid w-full gap-2 sm:w-auto sm:min-w-[220px]">
          <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted" htmlFor="calendar-view-mode">
            Ansicht
          </label>
          <select
            id="calendar-view-mode"
            value={viewMode}
            onChange={(event) => setViewMode(event.target.value as CalendarViewMode)}
            className="h-10 rounded-lg border border-outline-soft bg-white px-3 text-sm font-medium text-ink"
          >
            <option value="day">Tag</option>
            <option value="week">Woche</option>
            <option value="agenda">Events</option>
          </select>
        </div>

        <div className="grid w-full gap-2 lg:hidden">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Kalender einblenden</p>
          <div className="thin-scrollbar flex gap-2 overflow-x-auto pb-1">
            <CalendarFilterChip label="Alle" active={isAllCalendarsVisible} onClick={onShowAllCalendars} />
            {calendars.map((calendar) => {
              const active = activeCalendarIds.includes(calendar.id);
              return (
                <CalendarFilterChip
                  key={calendar.id}
                  label={calendar.summary}
                  active={active}
                  color={calendar.backgroundColor ?? "#0078d4"}
                  onClick={() => onCalendarVisibilityChange(calendar.id)}
                />
              );
            })}
          </div>
        </div>

        {viewMode === "day" && (
          <div className="thin-scrollbar flex w-full gap-2 overflow-x-auto pb-1">
            {days.map((day) => {
              const dateKey = toDateKey(day);
              const active = dateKey === focusedDateKey;
              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => setFocusedDateKey(dateKey)}
                  className={`inline-flex h-10 shrink-0 items-center rounded-full border px-3 text-sm font-medium ${
                    active ? "border-primary-dark bg-blue-50 text-primary-dark" : "border-outline-soft bg-white text-muted"
                  }`}
                >
                  {formatDayLabel(day)}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <button
            type="button"
            onClick={onToday}
            className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-primary-dark px-4 font-medium text-white shadow-sm hover:bg-primary-blue sm:flex-none"
          >
            Heute
          </button>
        </div>
      </header>

      {warning && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 sm:px-6">
          {warning}
        </div>
      )}

      {viewMode === "agenda" ? (
        <AgendaView events={sortedEvents} onEditEvent={onEditEvent} />
      ) : (
        <div className="relative lg:min-h-0 lg:flex-1 lg:overflow-hidden">
          <div className="thin-scrollbar sticky top-0 h-[calc(100dvh-74px-env(safe-area-inset-bottom))] overflow-auto lg:static lg:h-full">
            <div
              className={`grid ${viewMode === "week" ? "min-w-0 sm:min-w-[840px]" : "min-w-0 sm:min-w-[420px]"}`}
              style={{
                gridTemplateColumns: viewMode === "week" ? "40px repeat(7, minmax(0, 1fr))" : "56px minmax(0, 1fr)"
              }}
            >
              <div className="sticky top-0 z-20 h-[72px] border-b border-r border-line bg-white" />
              {displayDays.map((day) => {
                const dateKey = toDateKey(day);
                const isToday = dateKey === toDateKey(new Date());
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => {
                      setFocusedDateKey(dateKey);
                      setViewMode("day");
                    }}
                    className={`sticky top-0 z-20 flex h-[72px] flex-col items-center justify-center border-b border-r border-line bg-white text-center ${
                      isToday ? "bg-blue-50" : ""
                    }`}
                  >
                    <span className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${isToday ? "text-primary-dark" : "text-muted"}`}>
                      {new Intl.DateTimeFormat("de-DE", { weekday: "short" }).format(day)}
                    </span>
                    <span className={`text-base font-semibold sm:text-xl ${isToday ? "text-primary-dark" : "text-ink"}`}>{day.getDate()}</span>
                  </button>
                );
              })}

              <div className="border-r border-line bg-white">
                {hours.map((hour) => (
                  <div key={hour} className="h-[72px] border-b border-line/70 pt-2 text-center text-[11px] font-medium text-muted">
                    {String(hour).padStart(2, "0")}:00
                  </div>
                ))}
              </div>

              {displayDays.map((day) => {
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
                    onClick={(event) => handleEmptySlotClick(dateKey, event)}
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
        </div>
      )}

      <button
        type="button"
        onClick={onAddEvent}
        disabled={isReadOnly}
        className="fixed bottom-24 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary-blue text-white shadow-floating transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 lg:absolute lg:bottom-7 lg:right-7"
        aria-label="Termin hinzufuegen"
      >
        <CalendarPlus className="h-6 w-6" />
      </button>
    </section>
  );
}

function CalendarFilterChip({
  label,
  active,
  color,
  onClick
}: {
  label: string;
  active: boolean;
  color?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3 text-sm font-medium ${
        active ? "border-primary-dark bg-blue-50 text-primary-dark" : "border-outline-soft bg-white text-muted"
      }`}
    >
      {color && <span className="h-2.5 w-2.5 rounded" style={{ backgroundColor: color }} />}
      {label}
    </button>
  );
}

function AgendaView({ events, onEditEvent }: { events: PlanningEvent[]; onEditEvent: (event: PlanningEvent) => void }) {
  return (
    <div className="thin-scrollbar flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto grid max-w-4xl gap-3">
        {!events.length && (
          <div className="rounded-xl border-2 border-dashed border-outline-soft px-4 py-12 text-center text-sm text-muted">
            Keine Termine in dieser Woche.
          </div>
        )}
        {events.map((event) => (
          <article
            key={event.id}
            className="rounded-xl border border-line bg-white p-4 shadow-panel"
            style={{ borderLeftWidth: 4, borderLeftColor: event.calendarColor || "#0078d4" }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary-dark">{formatLongDate(dateKeyToDate(event.date))}</p>
                <h3 className="mt-1 truncate text-base font-semibold text-ink">{event.title}</h3>
                <p className="mt-1 text-sm text-muted">
                  {event.allDay ? "Ganztagig" : `${formatTime(event.start)} - ${formatTime(event.end)}`} · {event.calendarTitle}
                </p>
                {event.location && (
                  <p className="mt-2 flex items-center gap-1 text-sm text-muted">
                    <MapPin className="h-4 w-4" />
                    {event.location}
                  </p>
                )}
                {event.description && <p className="mt-3 text-sm leading-6 text-ink">{event.description}</p>}
              </div>
              <button
                type="button"
                onClick={() => onEditEvent(event)}
                disabled={!event.canEdit}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-outline-soft bg-white text-muted hover:bg-surface-low hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Termin bearbeiten"
              >
                <Edit3 className="h-4 w-4" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
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
  const palette =
    index % 3 === 1 ? "bg-emerald-50 text-emerald-950" : index % 3 === 2 ? "bg-amber-50 text-amber-950" : "bg-blue-50 text-blue-950";
  const gutter = 4;
  const left = `calc(${(column / columns) * 100}% + ${gutter / 2}px)`;
  const width = `calc(${100 / columns}% - ${gutter}px)`;
  const canEdit = event.canEdit && !isReadOnly;
  const canDrag = canEdit && !event.allDay;

  return (
    <article
      data-event-block="true"
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
      title={event.allDay ? "Ganztagige Termine koennen ueber Bearbeiten verschoben werden." : undefined}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0">
          <p className="text-[11px] font-bold">
            {event.allDay ? "Ganztagig" : `${formatTime(event.start)} - ${formatTime(event.end)}`}
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
      {!valid && <p className="mt-1 text-[11px] font-semibold">Ungueltige Position</p>}
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
    .sort((left, right) => left.start - right.start || right.end - left.end || left.event.title.localeCompare(right.event.title, "de"));

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

function getInitialFocusedDateKey(days: Date[]) {
  const todayKey = toDateKey(new Date());
  return days.some((day) => toDateKey(day) === todayKey) ? todayKey : toDateKey(days[0]);
}
