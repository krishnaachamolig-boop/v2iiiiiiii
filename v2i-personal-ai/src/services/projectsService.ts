import { supabase } from "@/lib/supabase";
import type { Project, ProjectStatus, TaskPriority } from "@/types";

export interface CreateProjectInput {
  name: string;
  description?: string;
  priority?: TaskPriority;
  deadline?: string | null;
  metadata?: Record<string, unknown>;
}

export const projectsService = {
  async list(userId: string, status?: ProjectStatus): Promise<Project[]> {
    let query = supabase.from("projects").select("*").eq("user_id", userId).order("updated_at", {
      ascending: false,
    });
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    if (error) throw error;
    return data as Project[];
  },

  async get(userId: string, projectId: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return data as Project | null;
  },

  async create(userId: string, input: CreateProjectInput): Promise<Project> {
    const { data, error } = await supabase
      .from("projects")
      .insert({
        user_id: userId,
        name: input.name,
        description: input.description ?? null,
        priority: input.priority ?? "medium",
        deadline: input.deadline ?? null,
        metadata: input.metadata ?? {},
        status: "planning",
      })
      .select()
      .single();
    if (error) throw error;
    return data as Project;
  },

  async update(userId: string, projectId: string, patch: Partial<Project>): Promise<Project> {
    const { data, error } = await supabase
      .from("projects")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", projectId)
      .eq("user_id", userId)
      .select()
      .single();
    if (error) throw error;
    return data as Project;
  },

  /** Summarizes project + its tasks into a status string (used by summarize_project tool). */
  async summarize(userId: string, projectId: string): Promise<string> {
    const project = await this.get(userId, projectId);
    if (!project) return "Project not found.";
    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("title,status,priority,due_date")
      .eq("user_id", userId)
      .eq("project_id", projectId);
    if (error) throw error;

    const total = tasks?.length ?? 0;
    const done = tasks?.filter((t) => t.status === "completed").length ?? 0;
    const pending = (tasks ?? []).filter((t) => t.status !== "completed");

    return [
      `Project: ${project.name} (${project.status}, priority ${project.priority})`,
      project.deadline ? `Deadline: ${project.deadline}` : "No deadline set",
      `Tasks: ${done}/${total} completed`,
      pending.length
        ? `Pending: ${pending.map((t) => `${t.title} [${t.priority}]`).join(", ")}`
        : "No pending tasks",
    ].join("\n");
  },
};
