import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { PlanningTask } from "../types/planning";
import { WeekTimeline } from "./WeekTimeline";

const task: PlanningTask = {
  kind: "task",
  id: "task:list:t1",
  sourceId: "t1",
  taskListId: "list",
  taskListTitle: "Inbox",
  title: "Angebot prüfen",
  notes: "Heute erledigen",
  status: "needsAction",
  dueDate: "2026-04-21",
  completedAt: null,
  raw: { id: "t1" }
};

describe("WeekTimeline", () => {
  it("renders tasks and sends completion actions", async () => {
    const onToggleTask = vi.fn();
    render(
      <WeekTimeline
        weekStart={new Date(2026, 3, 20)}
        filter="all"
        tasks={[task]}
        events={[]}
        onToggleTask={onToggleTask}
        onUpdateTask={vi.fn()}
        onUpdateEvent={vi.fn()}
      />
    );

    expect(screen.getByText("Angebot prüfen")).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText("Aufgabe abhaken"));
    expect(onToggleTask).toHaveBeenCalledWith(task);
  });
});
