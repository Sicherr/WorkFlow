import { useState } from "react";
import { Bell, CalendarDays, Check, ChevronDown, Edit3, Plus } from "lucide-react";
import type { GoogleTaskList } from "../types/google";
import type { PlanningTask } from "../types/planning";

interface TaskSectionProps {
  tasks: PlanningTask[];
  taskLists: GoogleTaskList[];
  activeTaskListId: string | null;
  isReadOnly: boolean;
  onAddTask: () => void;
  onEditTask: (task: PlanningTask) => void;
  onToggleTask: (task: PlanningTask) => void;
  onTaskDragStart: (task: PlanningTask) => void;
  onTaskDragEnd: () => void;
  onTaskListChange: (taskListId: string) => void;
}

export function TaskSection({
  tasks,
  taskLists,
  activeTaskListId,
  isReadOnly,
  onAddTask,
  onEditTask,
  onToggleTask,
  onTaskDragStart,
  onTaskDragEnd,
  onTaskListChange
}: TaskSectionProps) {
  const [showCompleted, setShowCompleted] = useState(false);
  const selectedTaskListId = activeTaskListId ?? taskLists[0]?.id ?? "";
  const visibleTasks = selectedTaskListId ? tasks.filter((task) => task.taskListId === selectedTaskListId) : tasks;
  const openTasks = visibleTasks.filter((task) => task.status !== "completed");
  const completedTasks = visibleTasks.filter((task) => task.status === "completed");
  const selectedListTitle = taskLists.find((list) => list.id === selectedTaskListId)?.title ?? "Alle Aufgaben";
  return (
    <div className="thin-scrollbar h-full overflow-y-auto bg-background pb-20 lg:pb-0">
      <section className="flex min-h-0 flex-col bg-white">
        <div className="border-b border-line px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-primary-dark">My Day</p>
              <h2 className="mt-1 truncate text-2xl font-semibold leading-8 text-ink sm:text-[28px] sm:leading-9">
                {selectedListTitle}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {openTasks.length} offen, {completedTasks.length} erledigt
              </p>
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <select
                value={selectedTaskListId}
                onChange={(event) => onTaskListChange(event.target.value)}
                className="h-10 min-w-0 flex-1 rounded-lg border border-outline-soft bg-white px-3 text-sm font-medium sm:flex-none"
                aria-label="Google-Taskliste auswählen"
              >
                {taskLists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.title}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={onAddTask}
                disabled={isReadOnly}
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-primary-dark px-4 font-medium text-white shadow-sm hover:bg-primary-blue disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
              >
                <Plus className="h-4 w-4" />
                Task hinzufügen
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto grid w-full max-w-5xl gap-3 px-4 py-4 sm:px-6 sm:py-6">
          {openTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onEditTask={onEditTask}
              onToggleTask={onToggleTask}
              onDragStart={onTaskDragStart}
              onDragEnd={onTaskDragEnd}
              isReadOnly={isReadOnly}
            />
          ))}
          {completedTasks.length > 0 && (
            <section className="mt-2 overflow-hidden rounded-lg border border-line bg-surface-low">
              <button
                type="button"
                onClick={() => setShowCompleted((current) => !current)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left font-medium text-ink hover:bg-surface-container"
                aria-expanded={showCompleted}
              >
                <span>Erledigt</span>
                <span className="flex items-center gap-2 text-sm text-muted">
                  {completedTasks.length}
                  <ChevronDown className={`h-4 w-4 transition-transform ${showCompleted ? "rotate-180" : ""}`} />
                </span>
              </button>
              {showCompleted && (
                <div className="grid gap-2 border-t border-line p-3">
                  {completedTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onEditTask={onEditTask}
                      onToggleTask={onToggleTask}
                      onDragStart={onTaskDragStart}
                      onDragEnd={onTaskDragEnd}
                      isReadOnly={isReadOnly}
                      compact
                    />
                  ))}
                </div>
              )}
            </section>
          )}
          {!visibleTasks.length && (
            <div className="rounded-xl border-2 border-dashed border-outline-soft px-4 py-12 text-center text-sm text-muted">
              Keine Aufgaben in dieser Liste.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function TaskRow({
  task,
  compact = false,
  onEditTask,
  onToggleTask,
  onDragStart,
  onDragEnd,
  isReadOnly
}: {
  task: PlanningTask;
  compact?: boolean;
  onEditTask: (task: PlanningTask) => void;
  onToggleTask: (task: PlanningTask) => void;
  onDragStart: (task: PlanningTask) => void;
  onDragEnd: () => void;
  isReadOnly: boolean;
}) {
  const isDone = task.status === "completed";

  return (
    <article
      draggable={!isReadOnly}
      onDragStart={(event) => {
        if (isReadOnly) {
          event.preventDefault();
          return;
        }
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", task.id);
        onDragStart(task);
      }}
      onDragEnd={onDragEnd}
      className={`group flex items-start gap-3 rounded-lg border p-3 transition-all hover:shadow-panel sm:items-center sm:gap-4 sm:p-4 ${
        isDone ? "border-transparent bg-surface-low opacity-70" : "border-line bg-white"
      } ${isReadOnly ? "cursor-default" : "cursor-grab active:cursor-grabbing"}`}
    >
      <button
        type="button"
        onClick={() => onToggleTask(task)}
        disabled={isReadOnly}
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
          isDone ? "border-primary-dark bg-primary-dark text-white" : "border-outline-soft bg-white text-transparent hover:border-primary-dark"
        } disabled:cursor-not-allowed disabled:opacity-50`}
        aria-label="Aufgabe abhaken"
      >
        <Check className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className={`font-medium leading-5 ${isDone ? "text-muted line-through" : "text-ink"}`}>{task.title}</p>
        </div>
        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2 text-xs text-muted">
          <span>{task.taskListTitle}</span>
          {task.dueDate && (
            <>
              <CalendarDays className="h-3.5 w-3.5 text-primary-dark" />
              <span className="text-primary-dark">{task.dueDate}</span>
            </>
          )}
          {task.notes && !compact && (
            <>
              <Bell className="h-3.5 w-3.5" />
              <span className="max-w-full truncate">{task.notes}</span>
            </>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onEditTask(task)}
        disabled={isReadOnly}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface-container hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Aufgabe bearbeiten"
      >
        <Edit3 className="h-4 w-4" />
      </button>
    </article>
  );
}
