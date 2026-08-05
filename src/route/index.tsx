import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check } from "lucide-react";
import {
  DAYS,
  parseRoutine,
  todayKey,
  todayName,
  type Routine,
} from "@/lib/routine";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gym Routine Tracker — Daily Checklist" },
      {
        name: "description",
        content:
          "Paste your weekly gym routine, see only today's exercises, and tick them off. Checks lock for the day and reset every morning.",
      },
      { property: "og:title", content: "Gym Routine Tracker — Daily Checklist" },
      {
        property: "og:description",
        content:
          "Paste your weekly gym routine and track today's exercises with locking checkboxes that reset each morning.",
      },
    ],
  }),
  component: Index,
});

const ROUTINE_KEY = "gym.routine";
const DONE_KEY = "gym.done";
const RESET_PASSWORD = "Tanzeem";

type DoneState = { date: string; items: string[] };

function Index() {
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const today = todayName();
  const key = todayKey();

  useEffect(() => {
    try {
      const r = localStorage.getItem(ROUTINE_KEY);
      if (r) setRoutine(JSON.parse(r) as Routine);
      const d = localStorage.getItem(DONE_KEY);
      if (d) {
        const parsed = JSON.parse(d) as DoneState;
        if (parsed.date === key) setDone(parsed.items);
      }
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, [key]);

  // Reset at the start of a new day, even if the tab stays open.
  useEffect(() => {
    const id = setInterval(() => {
      if (todayKey() !== key) window.location.reload();
    }, 30_000);
    return () => clearInterval(id);
  }, [key]);

  const exercises = useMemo(() => routine?.[today] ?? [], [routine, today]);

  function saveRoutine() {
    const parsed = parseRoutine(draft);
    localStorage.setItem(ROUTINE_KEY, JSON.stringify(parsed));
    setRoutine(parsed);
    setEditing(false);
  }

  function complete(name: string) {
    if (done.includes(name)) return;
    const items = [...done, name];
    setDone(items);
    localStorage.setItem(DONE_KEY, JSON.stringify({ date: key, items }));
  }

  function tryReset() {
    if (pw !== RESET_PASSWORD) {
      setPwError(true);
      return;
    }
    localStorage.removeItem(ROUTINE_KEY);
    localStorage.removeItem(DONE_KEY);
    setRoutine(null);
    setDone([]);
    setDraft("");
    setPw("");
    setPwError(false);
    setResetOpen(false);
    setEditing(false);
  }

  const total = exercises.length;
  const doneCount = exercises.filter((e) => done.includes(e)).length;

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-5 pb-16 pt-6">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {new Date().toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })}
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">{today}</h1>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full px-2 py-1 text-2xl leading-none transition-transform hover:scale-110">
            🗿
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={() => {
                setDraft(routineToText(routine));
                setEditing(true);
              }}
            >
              Edit routine
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setResetOpen(true)}>
              Reset everything
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {loaded && (!routine || editing) ? (
        <section className="mt-8 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Paste your routine
          </h2>
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={14}
            placeholder={
              "Monday\nBench press\nIncline dumbbell press\n\nTuesday\nDeadlift\nPull ups"
            }
            className="min-h-64 bg-card font-mono text-sm"
          />
          <div className="flex gap-2">
            <Button onClick={saveRoutine} disabled={!draft.trim()} className="flex-1">
              Save routine
            </Button>
            {routine && (
              <Button variant="secondary" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            )}
          </div>
        </section>
      ) : loaded ? (
        <section className="mt-6">
          {total > 0 && (
            <div className="mb-5">
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${(doneCount / total) * 100}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {doneCount} of {total} done
              </p>
            </div>
          )}

          {total === 0 ? (
            <p className="mt-16 text-center text-muted-foreground">
              Rest day. Nothing planned for {today}.
            </p>
          ) : (
            <ul className="space-y-2">
              {exercises.map((ex, i) => {
                const isDone = done.includes(ex);
                return (
                  <li key={`${ex}-${i}`}>
                    <button
                      type="button"
                      onClick={() => complete(ex)}
                      disabled={isDone}
                      className={`flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-4 text-left transition-colors ${
                        isDone ? "opacity-60" : "hover:bg-accent"
                      }`}
                    >
                      <span
                        className={`flex size-6 shrink-0 items-center justify-center rounded-md border-2 ${
                          isDone
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border"
                        }`}
                      >
                        {isDone && <Check className="size-4" strokeWidth={3} />}
                      </span>
                      <span
                        className={`text-base font-medium ${
                          isDone ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {ex}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {routine && (
            <div className="mt-10">
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground">
                Week
              </h3>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {DAYS.filter((d) => (routine[d]?.length ?? 0) > 0).map((d) => (
                  <div
                    key={d}
                    className={`rounded-lg border border-border px-3 py-2 ${
                      d === today ? "border-primary" : ""
                    }`}
                  >
                    <p className="text-sm font-semibold">{d}</p>
                    <p className="text-xs text-muted-foreground">
                      {routine[d]!.length} exercises
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      ) : null}

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Reset app</DialogTitle>
            <DialogDescription>
              Enter the password to wipe the routine and start fresh.
            </DialogDescription>
          </DialogHeader>
          <Input
            type="password"
            value={pw}
            maxLength={64}
            onChange={(e) => {
              setPw(e.target.value);
              setPwError(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && tryReset()}
            placeholder="Password"
          />
          {pwError && (
            <p className="text-sm text-destructive">Wrong password.</p>
          )}
          <Button variant="destructive" onClick={tryReset}>
            Reset everything
          </Button>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function routineToText(routine: Routine | null): string {
  if (!routine) return "";
  return DAYS.filter((d) => (routine[d]?.length ?? 0) > 0)
    .map((d) => `${d}\n${routine[d]!.join("\n")}`)
    .join("\n\n");
}
