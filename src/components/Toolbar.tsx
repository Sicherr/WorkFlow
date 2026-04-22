import { Bell, ChevronLeft, ChevronRight, HelpCircle, LogOut, RefreshCw, Search, UserCircle } from "lucide-react";
import { formatWeekRange } from "../lib/dates";
import type { AppTab } from "../store/uiStore";

interface ToolbarProps {
  activeTab: AppTab;
  weekStart: Date;
  isFetching: boolean;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onRefresh: () => void;
  onSignOut: () => void;
}

export function Toolbar({
  activeTab,
  weekStart,
  isFetching,
  onPreviousWeek,
  onNextWeek,
  onToday,
  onRefresh,
  onSignOut
}: ToolbarProps) {
  return (
    <header className="z-30 h-auto shrink-0 border-b border-line bg-white px-3 py-2 sm:px-4">
      <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-blue text-white">
              <span className="text-lg font-semibold">✓</span>
            </div>
            <div>
              <p className="text-lg font-bold leading-5 text-primary-dark">Workflow</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Modern Professional</p>
            </div>
          </div>
          <div className="hidden w-[360px] items-center gap-2 rounded-lg bg-surface-container px-3 py-2 md:flex">
            <Search className="h-4 w-4 text-primary-dark" />
            <input
              className="min-w-0 flex-1 border-none bg-transparent p-0 text-sm outline-none placeholder:text-muted focus:ring-0"
              placeholder="Search"
              type="search"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab === "calendar" && (
            <>
              <button
                type="button"
                onClick={onPreviousWeek}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-outline-soft bg-white hover:bg-surface-low"
                aria-label="Vorherige Woche"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex h-10 min-w-0 flex-1 items-center justify-center rounded-lg border border-outline-soft bg-white px-3 text-sm font-medium sm:min-w-44 sm:flex-none sm:text-base">
                {formatWeekRange(weekStart)}
              </div>
              <button
                type="button"
                onClick={onNextWeek}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-outline-soft bg-white hover:bg-surface-low"
                aria-label="Nächste Woche"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={onToday}
                className="h-10 rounded-lg bg-primary-dark px-4 font-medium text-white hover:bg-primary-blue"
              >
                Heute
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-outline-soft bg-white px-3 font-medium hover:bg-surface-low"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Sync
          </button>
          <button
            type="button"
            className="hidden h-10 w-10 items-center justify-center rounded-lg hover:bg-surface-container sm:inline-flex"
            aria-label="Benachrichtigungen"
          >
            <Bell className="h-5 w-5 text-muted" />
          </button>
          <button
            type="button"
            className="hidden h-10 w-10 items-center justify-center rounded-lg hover:bg-surface-container sm:inline-flex"
            aria-label="Hilfe"
          >
            <HelpCircle className="h-5 w-5 text-muted" />
          </button>
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-outline-soft bg-white px-3 font-medium hover:bg-surface-low"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Abmelden</span>
          </button>
          <UserCircle className="hidden h-9 w-9 text-primary-dark sm:block" />
        </div>
      </div>
    </header>
  );
}
