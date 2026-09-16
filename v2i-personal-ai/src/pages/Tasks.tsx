import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/authStore";
import { tasksService } from "@/services/tasksService";
import type { Task, TaskPriority, TaskStatus } from "@/types";
import clsx from "clsx";

const priorityColor: Record<TaskPriority, string> = {
  low: "text-slate-400",
  medium: "text-neon-blue",
  high: "text-amber-400",
  urgent: "text-red-400",
};

export default function Tasks() {
  const { profile } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskStatus | "all">("pending");
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const data = await tasksService.list(profile.id, filter === "all" ? undefined : { status: filter });
      setTasks(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, filter]);

  const addTask = async () => {
    if (!profile || !newTitle.trim()) return;
    await tasksService.create(profile.id, { title: newTitle.trim() });
    setNewTitle("");
    void load();
  };

  const complete = async (id: string) => {
    if (!profile) return;
    await tasksService.complete(profile.id, id);
    void load();
  };

  const remove = async (id: string) => {
    if (!profile) return;
    await tasksService.remove(profile.id, id);
    void load();
  };

  return (
    <div className="space-y-4 pt-6">
      <h1 className="text-lg font-semibold text-slate-100">Tasks</h1>

      <div className="flex gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          placeholder="Add a task…"
          className="flex-1 rounded-full border border-base-700 bg-base-900 px-4 py-2 text-sm outline-none focus:border-neon-cyan/60"
        />
        <button onClick={addTask} className="rounded-full bg-neon-cyan/20 px-4 py-2 text-sm text-neon-cyan">
          Add
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto text-xs">
        {(["pending", "in_progress", "completed", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              "rounded-full border px-3 py-1.5 whitespace-nowrap",
              filter === f ? "border-neon-cyan text-neon-cyan" : "border-base-700 text-slate-400"
            )}
          >
            {f.replace("_", " ")}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-slate-500">No tasks here.</p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((t) => (
            <li key={t.id} className="glass-card flex items-center justify-between rounded-xl2 px-4 py-3">
              <div>
                <p className={clsx("text-sm", t.status === "completed" && "line-through text-slate-500")}>
                  {t.title}
                </p>
                <p className={clsx("text-xs", priorityColor[t.priority])}>
                  {t.priority} {t.due_date && `· due ${new Date(t.due_date).toLocaleDateString()}`}
                </p>
              </div>
              <div className="flex gap-2 text-xs">
                {t.status !== "completed" && (
                  <button onClick={() => complete(t.id)} className="text-neon-cyan">
                    Done
                  </button>
                )}
                <button onClick={() => remove(t.id)} className="text-red-400">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
