import { describe, expect, it } from "vitest";
import { getDateKeyFromGoogleDate, getWeekStart, isDateKeyInRange, makeTaskDueIso, toDateKey } from "./dates";

describe("date helpers", () => {
  it("starts weeks on Monday", () => {
    expect(toDateKey(getWeekStart(new Date(2026, 3, 21)))).toBe("2026-04-20");
    expect(toDateKey(getWeekStart(new Date(2026, 3, 26)))).toBe("2026-04-20");
  });

  it("keeps Google Tasks due dates date-only", () => {
    expect(getDateKeyFromGoogleDate("2026-04-21T00:00:00.000Z")).toBe("2026-04-21");
    expect(makeTaskDueIso("2026-04-21")).toBe("2026-04-21T00:00:00.000Z");
  });

  it("checks inclusive week ranges", () => {
    expect(isDateKeyInRange("2026-04-20", new Date(2026, 3, 20), new Date(2026, 3, 26))).toBe(true);
    expect(isDateKeyInRange("2026-04-27", new Date(2026, 3, 20), new Date(2026, 3, 26))).toBe(false);
  });
});
