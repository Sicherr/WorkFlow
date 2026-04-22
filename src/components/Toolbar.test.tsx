import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Toolbar } from "./Toolbar";

describe("Toolbar", () => {
  it("triggers refresh from the toolbar", async () => {
    const onRefresh = vi.fn();
    render(
      <Toolbar
        activeTab="tasks"
        weekStart={new Date(2026, 3, 20)}
        isFetching={false}
        onPreviousWeek={vi.fn()}
        onNextWeek={vi.fn()}
        onToday={vi.fn()}
        onRefresh={onRefresh}
        onSignOut={vi.fn()}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "Sync" }));
    expect(onRefresh).toHaveBeenCalled();
  });
});
