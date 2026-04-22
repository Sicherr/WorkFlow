import { CheckCircle2, Database, KeyRound, ListTodo, Palette, RefreshCw, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import type { GoogleCalendarListEntry, GoogleTaskList } from "../types/google";

interface SettingsPageProps {
  taskLists: GoogleTaskList[];
  calendars: GoogleCalendarListEntry[];
  isSyncing: boolean;
  clientIdConfigured: boolean;
  onRefresh: () => void;
  onSignOut: () => void;
}

export function SettingsPage({
  taskLists,
  calendars,
  isSyncing,
  clientIdConfigured,
  onRefresh,
  onSignOut
}: SettingsPageProps) {
  return (
    <section className="thin-scrollbar h-full overflow-y-auto bg-background pb-20 lg:pb-0">
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-primary-dark">Settings</p>
          <h2 className="mt-2 text-2xl font-semibold leading-8 text-ink sm:text-[28px] sm:leading-9">App & Google Sync</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Verwalte Verbindung, Synchronisation und lokale App-Einstellungen. Diese Seite speichert keine Google
            Secrets im Browser.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          <SettingsCard icon={<KeyRound className="h-5 w-5" />} title="Google OAuth">
            <StatusRow label="Client ID" value={clientIdConfigured ? "Konfiguriert" : "Fehlt"} ok={clientIdConfigured} />
            <StatusRow label="Token-Modell" value="Browser OAuth" ok />
            <p className="mt-4 text-sm leading-6 text-muted">
              Für dieses MVP wird der Google Identity Services Token-Flow im Frontend verwendet.
            </p>
          </SettingsCard>

          <SettingsCard icon={<Database className="h-5 w-5" />} title="Datenquellen">
            <StatusRow label="Tasklisten" value={`${taskLists.length}`} ok={taskLists.length > 0} />
            <StatusRow label="Kalender" value={`${calendars.length}`} ok={calendars.length > 0} />
            <button
              type="button"
              onClick={onRefresh}
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-primary-dark px-4 font-medium text-white hover:bg-primary-blue"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
              Jetzt synchronisieren
            </button>
          </SettingsCard>

          <SettingsCard icon={<ListTodo className="h-5 w-5" />} title="Tasks">
            <p className="text-sm leading-6 text-muted">
              Aufgaben werden direkt mit Google Tasks synchronisiert. Lokale Zusatzfelder für Priorisierung werden nicht verwendet.
            </p>
            <div className="mt-4 rounded-lg bg-surface-low p-3 text-sm text-ink">
              Aktive Listen: {taskLists.map((list) => list.title).join(", ") || "Keine"}
            </div>
          </SettingsCard>

          <SettingsCard icon={<Palette className="h-5 w-5" />} title="Darstellung">
            <StatusRow label="Designsystem" value="Productivity Workspace" ok />
            <StatusRow label="Theme" value="Light Mode" ok />
            <p className="mt-4 text-sm leading-6 text-muted">
              Die Oberfläche nutzt die Fluent-nahe Vorlage aus `stitch_unified_task_calendar`.
            </p>
          </SettingsCard>
        </div>

        <section className="rounded-xl border border-line bg-white p-5 shadow-panel">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary-dark" />
                <h3 className="font-semibold">Sitzung</h3>
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                Beim Abmelden wird der aktuelle Browser-Token widerrufen. Google-Daten bleiben in deinem Google-Konto.
              </p>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              className="h-10 rounded-lg border border-outline-soft bg-white px-4 font-medium hover:bg-surface-low"
            >
              Abmelden
            </button>
          </div>
        </section>
      </div>
    </section>
  );
}

function SettingsCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-white p-5 shadow-panel">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-dark text-white">{icon}</span>
        <h3 className="font-semibold">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function StatusRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-line py-2 last:border-b-0">
      <span className="text-sm text-muted">{label}</span>
      <span className={`inline-flex items-center gap-1 text-sm font-medium ${ok ? "text-primary-dark" : "text-red-700"}`}>
        {ok && <CheckCircle2 className="h-4 w-4" />}
        {value}
      </span>
    </div>
  );
}
