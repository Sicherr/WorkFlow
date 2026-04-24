import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { savePlanningSnapshot } from "./lib/offlineCache";
import { useUiStore } from "./store/uiStore";
import type { PlanningData } from "./types/planning";

const session = vi.hoisted(() => ({
  accessToken: null,
  clientIdConfigured: true,
  isExpired: false,
  isSigningIn: false,
  error: null,
  signIn: vi.fn(),
  signOut: vi.fn()
}));

vi.mock("./hooks/useGoogleSession", () => ({
  useGoogleSession: () => session
}));

const cachedData: PlanningData = {
  taskLists: [{ id: "tasks", title: "Aufgaben" }],
  calendars: [{ id: "calendar", summary: "Kalender", accessRole: "writer" }],
  tasks: [
    {
      kind: "task",
      id: "task:tasks:t1",
      sourceId: "t1",
      taskListId: "tasks",
      taskListTitle: "Aufgaben",
      title: "Offline Aufgabe",
      notes: "",
      status: "needsAction",
      dueDate: "2026-04-20",
      completedAt: null,
      raw: { id: "t1" }
    }
  ],
  events: [],
  items: []
};

function renderApp() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
}

describe("App offline cache mode", () => {
  beforeEach(() => {
    localStorage.clear();
    session.signIn.mockClear();
    session.signOut.mockClear();
    useUiStore.setState({ activeTab: "tasks", activeTaskListId: null, visibleCalendarIds: null });
  });

  it("shows cached planning data read-only when no Google session is available", () => {
    savePlanningSnapshot("2026-04-20", cachedData);

    renderApp();

    expect(screen.getByText("Offline Aufgabe")).toBeInTheDocument();
    expect(screen.getByText("Offline-Modus")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Offline-Hinweis schlie/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Aufgabe abhaken" })).toBeDisabled();
  });
});


