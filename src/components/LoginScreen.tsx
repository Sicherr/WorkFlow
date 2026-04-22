import { CalendarDays, CheckCircle2, Sparkles } from "lucide-react";

interface LoginScreenProps {
  clientIdConfigured: boolean;
  isSigningIn: boolean;
  error: string | null;
  onSignIn: () => void;
}

export function LoginScreen({ clientIdConfigured, isSigningIn, error, onSignIn }: LoginScreenProps) {
  return (
    <main className="min-h-screen bg-[#f8fafc] px-5 py-8 text-ink">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center">
        <div className="grid w-full gap-10 lg:grid-cols-[1fr_0.8fr] lg:items-center">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-2 text-sm text-muted">
              <Sparkles className="h-4 w-4 text-task" />
              Google Tasks und Kalender in einer Arbeitsansicht
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-normal sm:text-6xl">
              Workflow Planner
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
              Plane Aufgaben und Termine gemeinsam, hake Tasks direkt ab und bearbeite Kalenderereignisse ohne zwischen
              Google-Oberflächen zu wechseln.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onSignIn}
                disabled={!clientIdConfigured || isSigningIn}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-ink px-5 font-medium text-white transition hover:bg-[#25314a] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CalendarDays className="h-5 w-5" />
                {isSigningIn ? "Verbinde..." : "Mit Google verbinden"}
              </button>
              <div className="rounded-md border border-line bg-white px-4 py-3 text-sm text-muted">
                OAuth läuft lokal im Browser. Keine Backend-Tokens in v1.
              </div>
            </div>
            {!clientIdConfigured && (
              <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Lege eine <code>.env</code> mit <code>VITE_GOOGLE_CLIENT_ID</code> an und starte die App neu.
              </p>
            )}
            {error && (
              <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{error}</p>
            )}
          </div>
          <div className="rounded-lg border border-line bg-white p-5 shadow-panel">
            <div className="grid gap-3">
              {["Gemeinsame Wochen-Timeline", "Tasks abhaken und synchronisieren", "Termine inline bearbeiten"].map(
                (label) => (
                  <div key={label} className="flex items-center gap-3 rounded-md bg-slate-50 p-4">
                    <CheckCircle2 className="h-5 w-5 text-task" />
                    <span className="font-medium">{label}</span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
