import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/lib/authStore";
import { tasksService } from "@/services/tasksService";
import { activityService } from "@/services/activityService";
import { isSupabaseConfigured } from "@/lib/supabase";
import { ConfigWarning } from "@/components/common/ConfigWarning";
import type { Task, ActivityLogEntry } from "@/types";

export default function Home() {
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activity, setActivity] = useState<ActivityLogEntry[]>([]);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!profile || !isSupabaseConfigured()) return;
    tasksService.list(profile.id, { status: "pending" }).then(setTasks).catch(console.error);
    activityService.recent(profile.id, 6).then(setActivity).catch(console.error);
  }, [profile]);

  const greeting = (() => {
    const h = now.getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="space-y-6 pb-6 pt-6">
      {!isSupabaseConfigured() && (
        <ConfigWarning message="Connect Supabase (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) to enable tasks, projects, and memory." />
      )}

      <div>
        <p className="text-sm text-slate-400">
          {greeting}, {profile?.name ?? "there"}
        </p>
        <p className="text-xs text-slate-500">
          {now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })} ·{" "}
          {now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      <div className="glass-card rounded-xl2 p-4">
        <p className="text-xs uppercase tracking-wide text-neon-cyan/80">AI Status</p>
        <p className="mt-1 text-sm text-slate-200">Online · ready for voice or text commands</p>
      </div>

      <button
        onClick={() => navigate("/chat")}
        className="flex w-full flex-col items-center gap-4 rounded-xl2 border border-base-700 bg-base-900/60 py-10 shadow-glow"
      >
        <span className="flex h-20 w-20 items-center justify-center rounded-full border border-neon-cyan/50 bg-neon-cyan/10 shadow-glow-lg">
          <svg viewBox="0 0 24 24" fill="none" className="h-9 w-9 text-neon-cyan">
            <path d="M12 15a3 3 0 003-3V6a3 3 0 10-6 0v6a3 3 0 003 3z" fill="currentColor" />
            <path
              d="M19 11a1 1 0 00-2 0 5 5 0 01-10 0 1 1 0 10-2 0 7 7 0 006 6.93V20H9a1 1 0 100 2h6a1 1 0 100-2h-2v-2.07A7 7 0 0019 11z"
              fill="currentColor"
            />
          </svg>
        </span>
        <span className="text-sm font-medium text-slate-200">Talk to V2i</span>
      </button>

      <div className="grid grid-cols-3 gap-3 text-center text-xs">
        <QuickAction label="Type" onClick={() => navigate("/chat")} />
        <QuickAction label="Tasks" onClick={() => navigate("/tasks")} />
        <QuickAction label="Projects" onClick={() => navigate("/projects")} />
      </div>

      <Section title="Today's pending work">
        {tasks.length === 0 ? (
          <p className="text-sm text-slate-500">Nothing pending — you're clear.</p>
        ) : (
          <ul className="space-y-2">
            {tasks.slice(0, 5).map((t) => (
              <li key={t.id} className="glass-card flex items-center justify-between rounded-xl px-3 py-2 text-sm">
                <span>{t.title}</span>
                <span className="text-xs text-slate-500">{t.priority}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Recent activity">
        {activity.length === 0 ? (
          <p className="text-sm text-slate-500">No activity yet.</p>
        ) : (
          <ul className="space-y-1">
            {activity.map((a) => (
              <li key={a.id} className="text-xs text-slate-500">
                <span className={a.status === "failure" ? "text-red-400" : "text-slate-400"}>●</span> {a.action}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">{title}</p>
      {children}
    </div>
  );
}

function QuickAction({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="glass-card rounded-xl2 py-3 text-slate-300 hover:border-neon-cyan/50">
      {label}
    </button>
  );
}
