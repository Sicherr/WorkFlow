import { FormEvent, useState } from "react";
import { Plus } from "lucide-react";

interface MobileTaskQuickAddProps {
  listTitle: string;
  disabled: boolean;
  isBusy: boolean;
  onSubmit: (title: string) => void;
}

export function MobileTaskQuickAdd({ listTitle, disabled, isBusy, onSubmit }: MobileTaskQuickAddProps) {
  const [title, setTitle] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const nextTitle = title.trim();
    if (!nextTitle || disabled || isBusy) return;
    onSubmit(nextTitle);
    setTitle("");
  }

  return (
    <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+74px)] z-30 border-t border-line bg-white/95 px-3 py-3 shadow-[0_-10px_24px_rgba(0,0,0,0.08)] backdrop-blur lg:hidden">
      <form className="mx-auto flex max-w-3xl items-center gap-2" onSubmit={submit}>
        <div className="min-w-0 flex-1">
          <label className="sr-only" htmlFor="mobile-task-quick-add">
            Aufgabe schnell hinzufügen
          </label>
          <input
            id="mobile-task-quick-add"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={`Zu ${listTitle} hinzufügen`}
            disabled={disabled || isBusy}
            className="h-11 w-full rounded-xl border border-line bg-white px-4 text-sm text-ink placeholder:text-muted focus:border-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-dark/15 disabled:cursor-not-allowed disabled:bg-surface-low disabled:text-muted"
          />
        </div>
        <button
          type="submit"
          disabled={disabled || isBusy || !title.trim()}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-dark text-white shadow-sm hover:bg-primary-blue disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Aufgabe schnell hinzufügen"
        >
          <Plus className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
