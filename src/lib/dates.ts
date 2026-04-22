export const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function getWeekStart(date = new Date()): Date {
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  return startOfDay(addDays(date, mondayOffset));
}

export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function dateKeyToDate(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatDayLabel(date: Date): string {
  return new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" }).format(date);
}

export function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "2-digit", month: "long" }).format(date);
}

export function formatWeekRange(weekStart: Date): string {
  const end = addDays(weekStart, 6);
  const formatter = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "short" });
  return `${formatter.format(weekStart)} - ${formatter.format(end)}`;
}

export function getDateKeyFromGoogleDate(value?: string): string | null {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  return toDateKey(new Date(value));
}

export function makeTaskDueIso(dateKey: string): string {
  return `${dateKey}T00:00:00.000Z`;
}

export function formatTime(value: string): string {
  return new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export function timeInputFromIso(value: string): string {
  const date = new Date(value);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function dateTimeFromInputs(dateKey: string, time: string): string {
  const [hour, minute] = time.split(":").map(Number);
  const date = dateKeyToDate(dateKey);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

export function minutesSinceStartOfDay(value: string): number {
  const date = new Date(value);
  return date.getHours() * 60 + date.getMinutes();
}

export function eventDurationMinutes(start: string, end: string): number {
  return Math.max(30, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000));
}

export function isDateKeyInRange(dateKey: string | null, start: Date, end: Date): boolean {
  if (!dateKey) return false;
  const date = dateKeyToDate(dateKey).getTime();
  return date >= startOfDay(start).getTime() && date <= startOfDay(end).getTime();
}
