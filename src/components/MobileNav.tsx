import { CalendarDays, ListTodo, Settings } from "lucide-react";
import type { ReactNode } from "react";
import type { AppTab } from "../store/uiStore";

interface MobileNavProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

export function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-3 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur lg:hidden">
      <div className="grid grid-cols-3 gap-1">
        <MobileNavButton
          active={activeTab === "tasks"}
          icon={<ListTodo className="h-5 w-5" />}
          label="Tasks"
          onClick={() => onTabChange("tasks")}
        />
        <MobileNavButton
          active={activeTab === "calendar"}
          icon={<CalendarDays className="h-5 w-5" />}
          label="Kalender"
          onClick={() => onTabChange("calendar")}
        />
        <MobileNavButton
          active={activeTab === "settings"}
          icon={<Settings className="h-5 w-5" />}
          label="Settings"
          onClick={() => onTabChange("settings")}
        />
      </div>
    </nav>
  );
}

function MobileNavButton({
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
      className={`flex h-14 flex-col items-center justify-center gap-1 rounded-lg text-xs font-semibold transition ${
        active ? "bg-primary-dark text-white" : "text-muted hover:bg-surface-container hover:text-ink"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
