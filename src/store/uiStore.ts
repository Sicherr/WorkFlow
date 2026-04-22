import { create } from "zustand";
import { addDays, getWeekStart } from "../lib/dates";

export type AppTab = "tasks" | "calendar" | "settings";

interface UiState {
  activeTab: AppTab;
  activeTaskListId: string | null;
  visibleCalendarIds: string[] | null;
  weekStart: Date;
  setActiveTab: (tab: AppTab) => void;
  setActiveTaskListId: (taskListId: string | null) => void;
  setVisibleCalendarIds: (calendarIds: string[] | null) => void;
  toggleCalendarVisibility: (calendarId: string) => void;
  previousWeek: () => void;
  nextWeek: () => void;
  goToToday: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeTab: "tasks",
  activeTaskListId: null,
  visibleCalendarIds: null,
  weekStart: getWeekStart(),
  setActiveTab: (activeTab) => set({ activeTab }),
  setActiveTaskListId: (activeTaskListId) => set({ activeTaskListId }),
  setVisibleCalendarIds: (visibleCalendarIds) => set({ visibleCalendarIds }),
  toggleCalendarVisibility: (calendarId) =>
    set((state) => {
      const current = state.visibleCalendarIds;
      if (!current) return { visibleCalendarIds: [] };
      return current.includes(calendarId)
        ? { visibleCalendarIds: current.filter((id) => id !== calendarId) }
        : { visibleCalendarIds: [...current, calendarId] };
    }),
  previousWeek: () => set((state) => ({ weekStart: addDays(state.weekStart, -7) })),
  nextWeek: () => set((state) => ({ weekStart: addDays(state.weekStart, 7) })),
  goToToday: () => set({ weekStart: getWeekStart() })
}));
