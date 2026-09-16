import { supabase } from "@/lib/supabase";
import type { ActivityLogEntry } from "@/types";

export const activityService = {
  async log(
    userId: string,
    action: string,
    status: ActivityLogEntry["status"],
    tool: string | null = null,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    const { error } = await supabase.from("activity_logs").insert({
      user_id: userId,
      action,
      tool,
      status,
      metadata,
    });
    if (error) console.error("[Activity] Failed to log activity:", error);
  },

  async recent(userId: string, limit = 20): Promise<ActivityLogEntry[]> {
    const { data, error } = await supabase
      .from("activity_logs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data as ActivityLogEntry[];
  },
};
