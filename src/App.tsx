import { useEffect, useRef, useState, type TouchEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, X } from "lucide-react";
import { CalendarSection, type CalendarEventMove } from "./components/CalendarSection";
import { EventForm, TaskForm } from "./components/EntryForms";
import { LoginScreen } from "./components/LoginScreen";
import { MobileTaskQuickAdd } from "./components/MobileTaskQuickAdd";
import { Modal } from "./components/Modal";
import { MobileNav } from "./components/MobileNav";
import { SettingsPage } from "./components/SettingsPage";
import { Sidebar } from "./components/Sidebar";
import { TaskSection } from "./components/TaskSection";
import { useGoogleSession } from "./hooks/useGoogleSession";
import { createEvent, createTask, GoogleApiError, loadPlanningData, moveTaskToList, updateEvent, updateTask } from "./lib/googleApi";
import { dateKeyToDate, dateTimeFromInputs, makeTaskDueIso, toDateKey } from "./lib/dates";
import {
  clearPlanningSnapshots,
  loadLastPlanningSnapshot,
  loadPlanningSnapshot,
  savePlanningSnapshot,
  type OfflinePlanningSnapshot
} from "./lib/offlineCache";
import { mapEventToPlanningItem, mapTaskToPlanningItem, sortPlanningItems } from "./lib/planning";
import { useUiStore } from "./store/uiStore";
import type { EventDraft, PlanningData, PlanningEvent, PlanningTask, TaskDraft } from "./types/planning";

function queryKey(token: string | null, weekStart: Date) {
  return ["planning", token, toDateKey(weekStart)] as const;
}

export default function App() {
  const queryClient = useQueryClient();
  const session = useGoogleSession();
  const {
    activeTab,
    activeTaskListId,
    visibleCalendarIds,
    weekStart,
    setActiveTab,
    setActiveTaskListId,
    setVisibleCalendarIds,
    toggleCalendarVisibility,
    previousWeek,
    nextWeek,
    goToToday
  } = useUiStore();
  const selectedWeekKey = toDateKey(weekStart);
  const [modal, setModal] = useState<
    | { kind: "create-task" }
    | { kind: "edit-task"; task: PlanningTask }
    | { kind: "create-event"; initialDraft?: Partial<EventDraft> }
    | { kind: "edit-event"; event: PlanningEvent }
    | null
  >(null);
  const [draggedTask, setDraggedTask] = useState<PlanningTask | null>(null);
  const [offlineSnapshot, setOfflineSnapshot] = useState<OfflinePlanningSnapshot | null>(
    () => loadPlanningSnapshot(selectedWeekKey) ?? loadLastPlanningSnapshot()
  );
  const [isOfflineNoticeDismissed, setIsOfflineNoticeDismissed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const contentTouchStartRef = useRef<{ x: number; y: number } | null>(null);
  const sidebarTouchStartRef = useRef<{ x: number; y: number } | null>(null);
  const activeQueryKey = queryKey(session.accessToken, weekStart);

  const planningQuery = useQuery({
    queryKey: activeQueryKey,
    queryFn: () => loadPlanningData(session.accessToken!, weekStart),
    enabled: Boolean(session.accessToken)
  });

  useEffect(() => {
    if (planningQuery.data) {
      setOfflineSnapshot(savePlanningSnapshot(selectedWeekKey, planningQuery.data));
      return;
    }

    setOfflineSnapshot(loadPlanningSnapshot(selectedWeekKey) ?? loadLastPlanningSnapshot());
  }, [planningQuery.data, selectedWeekKey]);

  const toggleTaskMutation = useMutation({
    mutationFn: async (task: PlanningTask) => {
      const nextStatus = task.status === "completed" ? "needsAction" : "completed";
      return updateTask(session.accessToken!, task.taskListId, task.sourceId, {
        status: nextStatus,
        completed: nextStatus === "completed" ? new Date().toISOString() : null
      });
    },
    onMutate: async (task) => {
      await queryClient.cancelQueries({ queryKey: activeQueryKey });
      const previous = queryClient.getQueryData<PlanningData>(activeQueryKey);
      const nextStatus = task.status === "completed" ? "needsAction" : "completed";
      queryClient.setQueryData<PlanningData>(activeQueryKey, (current) =>
        current ? replaceTask(current, task.id, { status: nextStatus, completedAt: nextStatus === "completed" ? new Date().toISOString() : null }) : current
      );
      return { previous };
    },
    onError: (_error, _task, context) => {
      if (context?.previous) queryClient.setQueryData(activeQueryKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: activeQueryKey })
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({
      task,
      values
    }: {
      task: PlanningTask;
      values: { title: string; notes: string; dueDate: string };
    }) => {
      return updateTask(session.accessToken!, task.taskListId, task.sourceId, {
        title: values.title,
        notes: values.notes,
        due: values.dueDate ? makeTaskDueIso(values.dueDate) : undefined
      });
    },
    onMutate: async ({ task, values }) => {
      await queryClient.cancelQueries({ queryKey: activeQueryKey });
      const previous = queryClient.getQueryData<PlanningData>(activeQueryKey);
      queryClient.setQueryData<PlanningData>(activeQueryKey, (current) =>
        current
          ? replaceTask(current, task.id, {
              title: values.title,
              notes: values.notes,
              dueDate: values.dueDate
            })
          : current
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(activeQueryKey, context.previous);
    },
    onSuccess: () => setModal(null),
    onSettled: () => queryClient.invalidateQueries({ queryKey: activeQueryKey })
  });

  const moveTaskMutation = useMutation({
    mutationFn: ({ task, targetTaskListId }: { task: PlanningTask; targetTaskListId: string }) =>
      moveTaskToList(session.accessToken!, task.taskListId, task.sourceId, targetTaskListId),
    onMutate: async ({ task, targetTaskListId }) => {
      if (task.taskListId === targetTaskListId) return { previous: undefined };

      await queryClient.cancelQueries({ queryKey: activeQueryKey });
      const previous = queryClient.getQueryData<PlanningData>(activeQueryKey);
      const targetList = previous?.taskLists.find((list) => list.id === targetTaskListId);

      if (targetList) {
        queryClient.setQueryData<PlanningData>(activeQueryKey, (current) =>
          current ? moveTaskInCache(current, task.id, targetList.id, targetList.title) : current
        );
      }

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(activeQueryKey, context.previous);
    },
    onSettled: () => {
      setDraggedTask(null);
      queryClient.invalidateQueries({ queryKey: activeQueryKey });
    }
  });

  const createTaskMutation = useMutation({
    mutationFn: (draft: TaskDraft) => createTask(session.accessToken!, draft),
    onSuccess: (createdTask, draft) => {
      const taskList = planningQuery.data?.taskLists.find((list) => list.id === draft.taskListId);
      if (!taskList) {
        setModal(null);
        return queryClient.invalidateQueries({ queryKey: activeQueryKey });
      }
      queryClient.setQueryData<PlanningData>(activeQueryKey, (current) => {
        if (!current) return current;
        const task = mapTaskToPlanningItem(createdTask, taskList);
        return { ...current, tasks: [task, ...current.tasks], items: sortPlanningItems([task, ...current.items]) };
      });
      setModal(null);
    }
  });

  const createEventMutation = useMutation({
    mutationFn: (draft: EventDraft) => createEvent(session.accessToken!, draft),
    onSuccess: (createdEvent, draft) => {
      const calendar = planningQuery.data?.calendars.find((item) => item.id === draft.calendarId);
      if (!calendar) {
        setModal(null);
        return queryClient.invalidateQueries({ queryKey: activeQueryKey });
      }
      queryClient.setQueryData<PlanningData>(activeQueryKey, (current) => {
        if (!current) return current;
        const event = mapEventToPlanningItem(createdEvent, calendar);
        return { ...current, events: [event, ...current.events], items: sortPlanningItems([event, ...current.items]) };
      });
      setModal(null);
    }
  });

  const updateEventMutation = useMutation({
    mutationFn: ({
      event,
      values
    }: {
      event: PlanningEvent;
      values: Parameters<typeof makeEventUpdateBody>[0];
    }) => updateEvent(session.accessToken!, event.calendarId, event.sourceId, makeEventUpdateBody(values)),
    onMutate: async ({ event, values }) => {
      await queryClient.cancelQueries({ queryKey: activeQueryKey });
      const previous = queryClient.getQueryData<PlanningData>(activeQueryKey);
      queryClient.setQueryData<PlanningData>(activeQueryKey, (current) =>
        current
          ? replaceEvent(current, event.id, {
              title: values.title,
              description: values.description,
              location: values.location,
              date: values.date,
              start: makeEventUpdateBody(values).start.dateTime,
              end: makeEventUpdateBody(values).end.dateTime,
              allDay: false
            })
          : current
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(activeQueryKey, context.previous);
    },
    onSuccess: () => setModal(null),
    onSettled: () => queryClient.invalidateQueries({ queryKey: activeQueryKey })
  });

  const moveEventMutation = useMutation({
    mutationFn: ({ event, move }: { event: PlanningEvent; move: CalendarEventMove }) => {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return updateEvent(session.accessToken!, event.calendarId, event.sourceId, {
        summary: event.title,
        description: event.description || undefined,
        location: event.location || undefined,
        start: { dateTime: move.start, timeZone },
        end: { dateTime: move.end, timeZone }
      });
    },
    onMutate: async ({ event, move }) => {
      await queryClient.cancelQueries({ queryKey: activeQueryKey });
      const previous = queryClient.getQueryData<PlanningData>(activeQueryKey);
      queryClient.setQueryData<PlanningData>(activeQueryKey, (current) =>
        current
          ? replaceEvent(current, event.id, {
              start: move.start,
              end: move.end,
              date: move.date,
              allDay: false
            })
          : current
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(activeQueryKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: activeQueryKey })
  });

  const data = planningQuery.data ?? offlineSnapshot?.data;
  const cachedWeekStart = offlineSnapshot ? dateKeyToDate(offlineSnapshot.weekStartKey) : weekStart;
  const displayWeekStart = planningQuery.data ? weekStart : cachedWeekStart;
  const isReadOnlyOffline = Boolean(data && !planningQuery.data);
  const canWrite = Boolean(session.accessToken && !isReadOnlyOffline);
  const selectedTaskList = data?.taskLists.find((list) => list.id === activeTaskListId) ?? data?.taskLists[0] ?? null;

  useEffect(() => {
    setIsOfflineNoticeDismissed(false);
  }, [offlineSnapshot?.savedAt, isReadOnlyOffline]);

  useEffect(() => {
    if (isReadOnlyOffline) {
      setModal(null);
      setDraggedTask(null);
    }
  }, [isReadOnlyOffline]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsMobileSidebarOpen(false);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSignOut = async () => {
    clearPlanningSnapshots();
    setOfflineSnapshot(null);
    await session.signOut();
  };

  if (!session.accessToken && !offlineSnapshot) {
    return (
      <LoginScreen
        clientIdConfigured={session.clientIdConfigured}
        isSigningIn={session.isSigningIn}
        error={session.error}
        onSignIn={() => session.signIn("consent")}
      />
    );
  }

  const activeCalendarIds = visibleCalendarIds ?? data?.calendars.map((calendar) => calendar.id) ?? [];
  const visibleEvents = data?.events.filter((event) => activeCalendarIds.includes(event.calendarId)) ?? [];
  const showMobileSidebarControls = activeTab === "tasks" || activeTab === "calendar" || activeTab === "settings";
  const showMobileQuickAdd = activeTab === "tasks" && Boolean(data) && !isMobileSidebarOpen;

  const canUseMobileSidebar = () => showMobileSidebarControls && window.innerWidth < 1024;

  const handleContentTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (!canUseMobileSidebar() || isMobileSidebarOpen) return;

    const touch = event.touches[0];
    if (touch.clientX > 28) return;
    contentTouchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleContentTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = contentTouchStartRef.current;
    contentTouchStartRef.current = null;

    if (!start || !canUseMobileSidebar() || isMobileSidebarOpen) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = Math.abs(touch.clientY - start.y);
    if (deltaX > 70 && deltaY < 60) setIsMobileSidebarOpen(true);
  };

  const handleSidebarTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (!canUseMobileSidebar()) return;

    const touch = event.touches[0];
    sidebarTouchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleSidebarTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = sidebarTouchStartRef.current;
    sidebarTouchStartRef.current = null;

    if (!start || !canUseMobileSidebar()) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = Math.abs(touch.clientY - start.y);
    if (deltaX < -70 && deltaY < 60) setIsMobileSidebarOpen(false);
  };

  const handleTaskDropToList = (taskListId: string) => {
    if (!canWrite || !draggedTask || draggedTask.taskListId === taskListId) {
      setDraggedTask(null);
      return;
    }

    setActiveTaskListId(taskListId);
    moveTaskMutation.mutate({ task: draggedTask, targetTaskListId: taskListId });
  };
  const isBusy =
    toggleTaskMutation.isPending ||
    updateTaskMutation.isPending ||
    moveTaskMutation.isPending ||
    createTaskMutation.isPending ||
    createEventMutation.isPending ||
    updateEventMutation.isPending ||
    moveEventMutation.isPending;

  return (
    <main className="flex h-dvh flex-col bg-background text-ink">
      {isReadOnlyOffline && offlineSnapshot && !isOfflineNoticeDismissed && (
        <OfflineBanner
          snapshot={offlineSnapshot}
          hasSession={Boolean(session.accessToken)}
          onDismiss={() => setIsOfflineNoticeDismissed(true)}
        />
      )}

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          taskLists={data?.taskLists ?? []}
          calendars={data?.calendars ?? []}
          activeTaskListId={activeTaskListId}
          draggedTask={canWrite ? draggedTask : null}
          isReadOnly={isReadOnlyOffline}
          visibleCalendarIds={visibleCalendarIds}
          onTabChange={setActiveTab}
          onTaskListChange={setActiveTaskListId}
          onTaskDropToList={handleTaskDropToList}
          onShowAllCalendars={() => setVisibleCalendarIds((data?.calendars ?? []).map((calendar) => calendar.id))}
          onCalendarVisibilityChange={toggleCalendarVisibility}
          onAddTask={() => {
            if (canWrite) setModal({ kind: "create-task" });
          }}
        />
        {showMobileSidebarControls && (
          <>
            <button
              type="button"
              aria-label="Navigation schliessen"
              onClick={() => setIsMobileSidebarOpen(false)}
              className={`fixed inset-0 z-40 bg-ink/35 transition-opacity duration-200 lg:hidden ${
                isMobileSidebarOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
              }`}
            />
            <div
              className={`fixed inset-y-0 left-0 z-50 w-[300px] max-w-[85vw] transform transition-transform duration-200 ease-out lg:hidden ${
                isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
              }`}
              onTouchStart={handleSidebarTouchStart}
              onTouchEnd={handleSidebarTouchEnd}
            >
              <Sidebar
                activeTab={activeTab}
                taskLists={data?.taskLists ?? []}
                calendars={data?.calendars ?? []}
                activeTaskListId={activeTaskListId}
                draggedTask={canWrite ? draggedTask : null}
                isReadOnly={isReadOnlyOffline}
                visibleCalendarIds={visibleCalendarIds}
                onTabChange={setActiveTab}
                onTaskListChange={setActiveTaskListId}
                onTaskDropToList={handleTaskDropToList}
                onShowAllCalendars={() => setVisibleCalendarIds((data?.calendars ?? []).map((calendar) => calendar.id))}
                onCalendarVisibilityChange={toggleCalendarVisibility}
                onAddTask={() => {
                  if (canWrite) setModal({ kind: "create-task" });
                }}
                mobile
                onRequestClose={() => setIsMobileSidebarOpen(false)}
                className="shadow-floating"
              />
            </div>
          </>
        )}
        <div className="min-w-0 flex-1" onTouchStart={handleContentTouchStart} onTouchEnd={handleContentTouchEnd}>
          {planningQuery.isLoading && !data && <LoadingState />}
          {planningQuery.isError && !data && <ErrorState error={planningQuery.error} onRetry={() => planningQuery.refetch()} />}
          {data && activeTab === "tasks" && (
            <TaskSection
              tasks={data.tasks}
              activeTaskListId={activeTaskListId}
              isReadOnly={isReadOnlyOffline}
              onOpenSidebar={() => setIsMobileSidebarOpen(true)}
              onEditTask={(task) => {
                if (canWrite) setModal({ kind: "edit-task", task });
              }}
              onToggleTask={(task) => {
                if (canWrite) toggleTaskMutation.mutate(task);
              }}
              onTaskDragStart={(task) => {
                if (canWrite) setDraggedTask(task);
              }}
              onTaskDragEnd={() => window.setTimeout(() => setDraggedTask(null), 0)}
            />
          )}
          {data && activeTab === "calendar" && (
            <CalendarSection
              weekStart={displayWeekStart}
              events={visibleEvents}
              calendars={data.calendars}
              visibleCalendarIds={visibleCalendarIds}
              totalEventCount={data.events.length}
              visibleCalendarCount={activeCalendarIds.length}
              calendarCount={data.calendars.length}
              onPreviousWeek={previousWeek}
              onNextWeek={nextWeek}
              onToday={goToToday}
              onShowAllCalendars={() => setVisibleCalendarIds(data.calendars.map((calendar) => calendar.id))}
              onCalendarVisibilityChange={toggleCalendarVisibility}
              isReadOnly={isReadOnlyOffline}
              onAddEvent={() => {
                if (canWrite) setModal({ kind: "create-event" });
              }}
              onCreateEventAt={(draft) => {
                if (canWrite) setModal({ kind: "create-event", initialDraft: draft });
              }}
              onEditEvent={(event) => {
                if (canWrite) setModal({ kind: "edit-event", event });
              }}
              onMoveEvent={(event, move) => {
                if (canWrite) moveEventMutation.mutate({ event, move });
              }}
              onOpenSidebar={() => setIsMobileSidebarOpen(true)}
            />
          )}
          {data && activeTab === "settings" && (
            <SettingsPage
              taskLists={data.taskLists}
              calendars={data.calendars}
              isSyncing={planningQuery.isFetching || isBusy}
              clientIdConfigured={session.clientIdConfigured}
              onRefresh={() => (session.accessToken ? planningQuery.refetch() : session.signIn("consent"))}
              onSignOut={handleSignOut}
              onOpenSidebar={() => setIsMobileSidebarOpen(true)}
            />
          )}
        </div>
      </div>
      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
      {showMobileQuickAdd && selectedTaskList && (
        <MobileTaskQuickAdd
          listTitle={selectedTaskList.title}
          disabled={!canWrite}
          isBusy={createTaskMutation.isPending}
          onSubmit={(title) =>
            createTaskMutation.mutate({
              title,
              notes: "",
              dueDate: "",
              taskListId: selectedTaskList.id
            })
          }
        />
      )}
      {data && modal?.kind === "create-task" && (
        <Modal title="Task hinzufügen" onClose={() => setModal(null)}>
          <TaskForm
            taskLists={data.taskLists}
            initialTaskListId={activeTaskListId}
            isBusy={isBusy}
            submitLabel="Aufgabe erstellen"
            onCancel={() => setModal(null)}
            onSubmit={(draft) => createTaskMutation.mutate(draft as TaskDraft)}
          />
        </Modal>
      )}
      {data && modal?.kind === "edit-task" && (
        <Modal title="Task bearbeiten" onClose={() => setModal(null)}>
          <TaskForm
            task={modal.task}
            taskLists={data.taskLists}
            isBusy={isBusy}
            submitLabel="Speichern"
            onCancel={() => setModal(null)}
            onSubmit={(values) =>
              updateTaskMutation.mutate({
                task: modal.task,
                values: values as { title: string; notes: string; dueDate: string }
              })
            }
          />
        </Modal>
      )}
      {data && modal?.kind === "create-event" && (
        <Modal title="Termin hinzufügen" onClose={() => setModal(null)}>
          <EventForm
            calendars={data.calendars}
            isBusy={isBusy}
            submitLabel="Termin erstellen"
            onCancel={() => setModal(null)}
            onSubmit={(draft) => createEventMutation.mutate(draft as EventDraft)}
          />
        </Modal>
      )}
      {data && modal?.kind === "edit-event" && (
        <Modal title="Termin bearbeiten" onClose={() => setModal(null)}>
          <EventForm
            event={modal.event}
            calendars={data.calendars}
            isBusy={isBusy}
            submitLabel="Speichern"
            onCancel={() => setModal(null)}
            onSubmit={(values) =>
              updateEventMutation.mutate({
                event: modal.event,
                values: values as {
                  title: string;
                  description: string;
                  location: string;
                  date: string;
                  startTime: string;
                  endTime: string;
                }
              })
            }
          />
        </Modal>
      )}
    </main>
  );
}

function makeEventUpdateBody(values: {
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

function replaceTask(data: PlanningData, id: string, patch: Partial<PlanningTask>): PlanningData {
  const tasks = data.tasks.map((task) => (task.id === id ? { ...task, ...patch } : task));
  return { ...data, tasks, items: sortPlanningItems([...tasks, ...data.events]) };
}

function moveTaskInCache(
  data: PlanningData,
  id: string,
  targetTaskListId: string,
  targetTaskListTitle: string
): PlanningData {
  const tasks = data.tasks.map((task) =>
    task.id === id
      ? {
          ...task,
          id: `task:${targetTaskListId}:${task.sourceId}`,
          taskListId: targetTaskListId,
          taskListTitle: targetTaskListTitle
        }
      : task
  );
  return { ...data, tasks, items: sortPlanningItems([...tasks, ...data.events]) };
}

function replaceEvent(data: PlanningData, id: string, patch: Partial<PlanningEvent>): PlanningData {
  const events = data.events.map((event) => (event.id === id ? { ...event, ...patch } : event));
  return { ...data, events, items: sortPlanningItems([...data.tasks, ...events]) };
}

function OfflineBanner({
  snapshot,
  hasSession,
  onDismiss
}: {
  snapshot: OfflinePlanningSnapshot;
  hasSession: boolean;
  onDismiss: () => void;
}) {
  const savedAt = new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(snapshot.savedAt));

  return (
    <section className="pointer-events-none fixed inset-x-4 top-4 z-50 flex justify-end sm:left-auto sm:right-4">
      <div className="pointer-events-auto w-full max-w-sm rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 shadow-floating">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-amber-100 p-2 text-amber-800">
            <AlertCircle className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold">Offline-Modus</p>
              <button
                type="button"
                onClick={onDismiss}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-amber-800 hover:bg-amber-100"
                aria-label="Offline-Hinweis schlie�en"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 leading-6">
              Letzte Synchronisation {savedAt}. Die gespeicherten Daten sind schreibgesch�tzt.
            </p>
            <p className="mt-2 text-xs font-medium uppercase tracking-[0.08em] text-amber-800">
              {hasSession ? "Sync erneut versuchen" : "F�r Sync wieder mit Google verbinden"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function LoadingState() {
  return (
    <section className="rounded-lg border border-line bg-white p-8 text-center shadow-panel">
      <p className="font-medium">Google-Daten werden geladen...</p>
      <p className="mt-2 text-sm text-muted">Kalender, Tasklisten und Wocheneinträge werden zusammengeführt.</p>
    </section>
  );
}

function ErrorState({ error, onRetry }: { error: Error | null; onRetry: () => void }) {
  const message =
    error instanceof GoogleApiError && error.status === 401
      ? "Die Google-Sitzung ist abgelaufen. Bitte melde dich erneut an."
      : error?.message ?? "Die Daten konnten nicht geladen werden.";

  return (
    <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-950">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5" />
        <div>
          <p className="font-semibold">Sync fehlgeschlagen</p>
          <p className="mt-1 text-sm">{message}</p>
          <button type="button" onClick={onRetry} className="mt-3 h-9 rounded-md bg-red-900 px-3 text-sm font-medium text-white">
            Erneut versuchen
          </button>
        </div>
      </div>
    </section>
  );
}



