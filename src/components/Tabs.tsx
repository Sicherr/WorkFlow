import { CalendarDays, ListTodo, Settings } from "lucide-react";
import type { AppTab } from "../store/uiStore";

interface TabsProps {
  activeTab: AppTab;
  taskCount: number;
  eventCount: number;
  onChange: (tab: AppTab) => void;
}

export function Tabs({ activeTab, taskCount, eventCount, onChange }: TabsProps) {
  return (
    <nav aria-label="Hauptbereiche">
      <div className="grid h-10 grid-cols-3 rounded-lg bg-surface-container p-1">
        <button
          type="button"
          onClick={() => onChange("tasks")}
          className={`inline-flex items-center justify-center gap-2 rounded text-sm font-medium transition ${
            activeTab === "tasks" ? "bg-task text-white" : "text-muted hover:bg-slate-50 hover:text-ink"
          }`}
          aria-current={activeTab === "tasks" ? "page" : undefined}
        >
          <ListTodo className="h-4 w-4" />
          Tasks
          <span className={`rounded px-2 py-0.5 text-xs ${activeTab === "tasks" ? "bg-white/20" : "bg-slate-100"}`}>
            {taskCount}
          </span>
        </button>
        <button
          type="button"
          onClick={() => onChange("calendar")}
          className={`inline-flex items-center justify-center gap-2 rounded text-sm font-medium transition ${
            activeTab === "calendar" ? "bg-event text-white" : "text-muted hover:bg-slate-50 hover:text-ink"
          }`}
          aria-current={activeTab === "calendar" ? "page" : undefined}
        >
          <CalendarDays className="h-4 w-4" />
          Kalender
          <span className={`rounded px-2 py-0.5 text-xs ${activeTab === "calendar" ? "bg-white/20" : "bg-slate-100"}`}>
            {eventCount}
          </span>
        </button>
        <button
          type="button"
          onClick={() => onChange("settings")}
          className={`inline-flex items-center justify-center gap-2 rounded text-sm font-medium transition ${
            activeTab === "settings" ? "bg-ink text-white" : "text-muted hover:bg-slate-50 hover:text-ink"
          }`}
          aria-current={activeTab === "settings" ? "page" : undefined}
        >
          <Settings className="h-4 w-4" />
          Settings
        </button>
      </div>
    </nav>
  );
}
