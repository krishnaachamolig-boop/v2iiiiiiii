import { supabase } from "@/lib/supabase";
import type { Reminder } from "@/types";
import { scheduleLocalNotification } from "@/services/integrations/nativeNotifications";

export interface CreateReminderInput {
  title: string;
  remind_at: string; // ISO datetime
  task_id?: string | null;
  recurring_rule?: string | null;
}

export const remindersService = {
  async list(userId: string): Promise<Reminder[]> {
    const { data, error } = await supabase
      .from("reminders")
      .select("*")
      .eq("user_id", userId)
      .order("remind_at", { ascending: true });
    if (error) throw error;
    return data as Reminder[];
  },

  async create(userId: string, input: CreateReminderInput): Promise<Reminder> {
    const { data, error } = await supabase
      .from("reminders")
      .insert({
        user_id: userId,
        title: input.title,
        remind_at: input.remind_at,
        task_id: input.task_id ?? null,
        recurring_rule: input.recurring_rule ?? null,
        status: "scheduled",
      })
      .select()
      .single();
    if (error) throw error;

    // Native notification is best-effort: on web/without the plugin it
    // no-ops rather than throwing, so reminder creation never silently fails.
    await scheduleLocalNotification({
      id: data.id,
      title: "V2i Personal AI",
      body: input.title,
      at: new Date(input.remind_at),
    });

    return data as Reminder;
  },

  async cancel(userId: string, reminderId: string): Promise<void> {
    const { error } = await supabase
      .from("reminders")
      .update({ status: "cancelled" })
      .eq("id", reminderId)
      .eq("user_id", userId);
    if (error) throw error;
  },
};
