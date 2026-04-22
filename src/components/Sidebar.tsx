import { CalendarDays, CheckCircle2, List, Plus, Settings, Sun } from "lucide-react";
import type { ReactNode } from "react";
import type { GoogleCalendarListEntry, GoogleTaskList } from "../types/google";
import type { AppTab } from "../store/uiStore";
import type { PlanningTask } from "../types/planning";

interface SidebarProps {
  activeTab: AppTab;
  taskLists: GoogleTaskList[];
  calendars: GoogleCalendarListEntry[];
  activeTaskListId: string | null;
  draggedTask: PlanningTask | null;
  isReadOnly: boolean;
  visibleCalendarIds: string[] | null;
  onTabChange: (tab: AppTab) => void;
  onTaskListChange: (taskListId: string) => void;
  onTaskDropToList: (taskListId: string) => void;
  onCalendarVisibilityChange: (calendarId: string) => void;
  onAddTask: () => void;
}

export function Sidebar({
  activeTab,
  taskLists,
  calendars,
  activeTaskListId,
  draggedTask,
  isReadOnly,
  visibleCalendarIds,
  onTabChange,
  onTaskListChange,
  onTaskDropToList,
  onCalendarVisibilityChange,
  onAddTask
}: SidebarProps) {
  const selectedTaskListId = activeTaskListId ?? taskLists[0]?.id ?? "";
  const activeCalendarIds = visibleCalendarIds ?? calendars.map((calendar) => calendar.id);
  const getTaskListClassName = (taskListId: string) => {
    if (!isReadOnly && draggedTask && draggedTask.taskListId !== taskListId) {
      return "border border-dashed border-primary-dark bg-blue-50 text-primary-dark";
    }
    if (!isReadOnly && draggedTask?.taskListId === taskListId) return "opacity-45";
    if (selectedTaskListId === taskListId) return "bg-white font-semibold text-primary-dark shadow-sm";
    return "text-ink hover:bg-white/70";
  };

  return (
    <aside className="hidden w-[280px] shrink-0 flex-col border-r border-line bg-[#F3F2F1] lg:flex">
      <div className="border-b border-line px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-dark text-white shadow-sm">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-semibold text-primary-dark">Tasks & Calendar</h1>
            <p className="text-xs font-medium text-muted">Modern Professional</p>
          </div>
        </div>
      </div>

      <nav className="thin-scrollbar min-h-0 flex-1 overflow-y-auto px-2 py-4">
        <SidebarButton
          active={activeTab === "tasks"}
          icon={<Sun className="h-5 w-5" />}
          label="My Day"
          onClick={() => onTabChange("tasks")}
        />
        <SidebarButton
          active={activeTab === "calendar"}
          icon={<CalendarDays className="h-5 w-5" />}
          label="Calendar"
          onClick={() => onTabChange("calendar")}
        />
        <SidebarButton
          active={activeTab === "settings"}
          icon={<Settings className="h-5 w-5" />}
          label="Settings"
          onClick={() => onTabChange("settings")}
        />

        {activeTab === "tasks" && (
          <div className="mt-6 border-t border-line px-3 pt-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">My Lists</p>
            <div className="grid gap-1">
              {taskLists.map((list) => (
                <button
                  key={list.id}
                  type="button"
                  onDragOver={(event) => {
                    if (!isReadOnly && draggedTask && draggedTask.taskListId !== list.id) {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "move";
                    }
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (!isReadOnly) onTaskDropToList(list.id);
                  }}
                  onClick={() => {
                    onTaskListChange(list.id);
                    onTabChange("tasks");
                  }}
                  className={`flex items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition ${getTaskListClassName(list.id)}`}
                >
                  <List className="h-4 w-4 shrink-0" />
                  <span className="truncate">{list.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === "calendar" && (
          <div className="mt-6 border-t border-line px-3 pt-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">My Calendars</p>
            <div className="grid gap-1">
              {calendars.slice(0, 8).map((calendar) => (
                <label
                  key={calendar.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-ink hover:bg-white/70"
                >
                  <input
                    type="checkbox"
                    checked={activeCalendarIds.includes(calendar.id)}
                    onChange={() => onCalendarVisibilityChange(calendar.id)}
                    className="h-4 w-4 rounded border-outline-soft text-primary-dark focus:ring-primary-dark"
                  />
                  <span
                    className="h-3 w-3 rounded"
                    style={{ backgroundColor: calendar.backgroundColor ?? "#0078d4" }}
                  />
                  <span className="truncate">{calendar.summary}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </nav>

      {activeTab === "tasks" && (
        <div className="border-t border-line p-2">
          <button
            type="button"
            onClick={onAddTask}
            disabled={isReadOnly}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-ink hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-5 w-5" />
            New Task
          </button>
        </div>
      )}
    </aside>
  );
}

function SidebarButton({
  active,
  icon,
  label,
  onClick
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg border-l-4 px-3 py-2.5 text-left text-sm transition ${
        active
          ? "border-primary-dark bg-white font-semibold text-primary-dark shadow-sm"
          : "border-transparent text-ink hover:bg-white/70"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
