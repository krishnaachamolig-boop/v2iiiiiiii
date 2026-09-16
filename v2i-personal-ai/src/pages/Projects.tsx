import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/authStore";
import { projectsService } from "@/services/projectsService";
import type { Project } from "@/types";

export default function Projects() {
  const { profile } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [newName, setNewName] = useState("");
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!profile) return;
    setLoading(true);
    const data = await projectsService.list(profile.id);
    setProjects(data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const addProject = async () => {
    if (!profile || !newName.trim()) return;
    await projectsService.create(profile.id, { name: newName.trim() });
    setNewName("");
    void load();
  };

  const summarize = async (id: string) => {
    if (!profile) return;
    const summary = await projectsService.summarize(profile.id, id);
    setSummaries((s) => ({ ...s, [id]: summary }));
  };

  return (
    <div className="space-y-4 pt-6">
      <h1 className="text-lg font-semibold text-slate-100">Projects</h1>

      <div className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addProject()}
          placeholder="New project name…"
          className="flex-1 rounded-full border border-base-700 bg-base-900 px-4 py-2 text-sm outline-none focus:border-neon-cyan/60"
        />
        <button onClick={addProject} className="rounded-full bg-neon-cyan/20 px-4 py-2 text-sm text-neon-cyan">
          Create
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : projects.length === 0 ? (
        <p className="text-sm text-slate-500">No projects yet.</p>
      ) : (
        <ul className="space-y-3">
          {projects.map((p) => (
            <li key={p.id} className="glass-card rounded-xl2 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-100">{p.name}</p>
                  <p className="text-xs text-slate-500">
                    {p.status} · {p.priority}
                    {p.deadline && ` · due ${new Date(p.deadline).toLocaleDateString()}`}
                  </p>
                </div>
                <button onClick={() => summarize(p.id)} className="text-xs text-neon-cyan">
                  Summarize
                </button>
              </div>
              {summaries[p.id] && (
                <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-base-950 p-2 text-xs text-slate-400">
                  {summaries[p.id]}
                </pre>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
