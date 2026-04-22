import { CheckCircle2, Clock3, Inbox, ListTodo } from "lucide-react";
import type { ReactNode } from "react";
import type { PlanningEvent, PlanningTask } from "../types/planning";
import { formatLongDate, formatTime, toDateKey } from "../lib/dates";

interface DashboardProps {
  tasks: PlanningTask[];
  events: PlanningEvent[];
}

export function Dashboard({ tasks, events }: DashboardProps) {
  const todayKey = toDateKey(new Date());
  const todayTasks = tasks.filter((task) => task.dueDate === todayKey && task.status !== "completed");
  const todayEvents = events.filter((event) => event.date === todayKey);
  const upcomingTasks = tasks
    .filter((task) => task.status !== "completed" && task.dueDate && task.dueDate > todayKey)
    .slice(0, 5);
  const undatedTasks = tasks.filter((task) => task.status !== "completed" && !task.dueDate).slice(0, 5);
  const completedTasks = tasks.filter((task) => task.status === "completed").slice(0, 6);

  return (
    <aside className="grid gap-4">
      <Panel icon={<Clock3 className="h-4 w-4" />} title="Heute">
        <p className="mb-3 text-sm text-muted">{formatLongDate(new Date())}</p>
        <CompactList
          empty="Heute ist frei."
          items={[
            ...todayEvents.map((event) => ({
              key: event.id,
              label: event.title,
              meta: event.allDay ? "Ganztägig" : formatTime(event.start),
              kind: "event" as const
            })),
            ...todayTasks.map((task) => ({
              key: task.id,
              label: task.title,
              meta: task.taskListTitle,
              kind: "task" as const
            }))
          ]}
        />
      </Panel>
      <Panel icon={<ListTodo className="h-4 w-4" />} title="Demnächst">
        <CompactList
          empty="Keine kommenden Tasks."
          items={upcomingTasks.map((task) => ({
            key: task.id,
            label: task.title,
            meta: task.dueDate ?? "",
            kind: "task" as const
          }))}
        />
      </Panel>
      <Panel icon={<Inbox className="h-4 w-4" />} title="Ohne Datum">
        <CompactList
          empty="Alles terminiert."
          items={undatedTasks.map((task) => ({
            key: task.id,
            label: task.title,
            meta: task.taskListTitle,
            kind: "task" as const
          }))}
        />
      </Panel>
      <Panel icon={<CheckCircle2 className="h-4 w-4" />} title="Erledigt">
        <CompactList
          empty="Noch nichts erledigt."
          items={completedTasks.map((task) => ({
            key: task.id,
            label: task.title,
            meta: task.completedAt ? task.completedAt.slice(0, 10) : "erledigt",
            kind: "task" as const
          }))}
        />
      </Panel>
    </aside>
  );
}

function Panel({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-panel">
      <h2 className="mb-3 flex items-center gap-2 font-semibold">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded bg-slate-100 text-ink">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function CompactList({
  items,
  empty
}: {
  items: Array<{ key: string; label: string; meta: string; kind: "task" | "event" }>;
  empty: string;
}) {
  if (!items.length) return <p className="text-sm text-muted">{empty}</p>;

  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <div key={item.key} className="rounded-md border border-line bg-slate-50 px-3 py-2">
          <p className="truncate text-sm font-medium">{item.label}</p>
          <p className={`mt-1 text-xs ${item.kind === "task" ? "text-task" : "text-event"}`}>{item.meta}</p>
        </div>
      ))}
    </div>
  );
}
