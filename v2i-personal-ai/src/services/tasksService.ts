import { supabase } from "@/lib/supabase";
import type { Task, TaskStatus, TaskPriority } from "@/types";

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  due_date?: string | null;
  project_id?: string | null;
  category?: string | null;
  recurring_rule?: string | null;
}

export const tasksService = {
  async list(userId: string, filters?: { status?: TaskStatus; category?: string }): Promise<Task[]> {
    let query = supabase.from("tasks").select("*").eq("user_id", userId).order("due_date", {
      ascending: true,
      nullsFirst: false,
    });
    if (filters?.status) query = query.eq("status", filters.status);
    if (filters?.category) query = query.eq("category", filters.category);
    const { data, error } = await query;
    if (error) throw error;
    return data as Task[];
  },

  async create(userId: string, input: CreateTaskInput): Promise<Task> {
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        user_id: userId,
        title: input.title,
        description: input.description ?? null,
        priority: input.priority ?? "medium",
        due_date: input.due_date ?? null,
        project_id: input.project_id ?? null,
        category: input.category ?? null,
        recurring_rule: input.recurring_rule ?? null,
        status: "pending",
      })
      .select()
      .single();
    if (error) throw error;
    return data as Task;
  },

  async update(userId: string, taskId: string, patch: Partial<Task>): Promise<Task> {
    const { data, error } = await supabase
      .from("tasks")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", taskId)
      .eq("user_id", userId)
      .select()
      .single();
    if (error) throw error;
    return data as Task;
  },

  async complete(userId: string, taskId: string): Promise<Task> {
    return this.update(userId, taskId, { status: "completed" });
  },

  async remove(userId: string, taskId: string): Promise<void> {
    const { error } = await supabase.from("tasks").delete().eq("id", taskId).eq("user_id", userId);
    if (error) throw error;
  },
};
