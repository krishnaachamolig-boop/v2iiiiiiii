import { supabase } from "@/lib/supabase";
import type { MemoryItem, MemoryCategory } from "@/types";

/**
 * Persistent AI memory. Explicitly excludes secrets (passwords, API keys,
 * tokens) — callers must never pass those as `value`. The AI system prompt
 * (see src/ai/systemPrompt.ts) also instructs the model never to write
 * secret-like values to memory.
 */
const SECRET_LIKE_PATTERN = /(api[_-]?key|password|secret|token|bearer\s)/i;

export const memoryService = {
  async remember(
    userId: string,
    category: MemoryCategory,
    key: string,
    value: string,
    source: MemoryItem["source"] = "user_explicit"
  ): Promise<MemoryItem> {
    if (SECRET_LIKE_PATTERN.test(key) || SECRET_LIKE_PATTERN.test(value)) {
      throw new Error("Refused to store memory item that looks like a secret/credential.");
    }
    const { data, error } = await supabase
      .from("ai_memory")
      .upsert(
        { user_id: userId, category, key, value, source },
        { onConflict: "user_id,category,key" }
      )
      .select()
      .single();
    if (error) throw error;
    return data as MemoryItem;
  },

  async list(userId: string, category?: MemoryCategory): Promise<MemoryItem[]> {
    let query = supabase.from("ai_memory").select("*").eq("user_id", userId);
    if (category) query = query.eq("category", category);
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;
    return data as MemoryItem[];
  },

  async forget(userId: string, memoryId: string): Promise<void> {
    const { error } = await supabase.from("ai_memory").delete().eq("id", memoryId).eq("user_id", userId);
    if (error) throw error;
  },

  /** Builds a compact context block to inject into the system prompt. */
  async buildContextSummary(userId: string): Promise<string> {
    const items = await this.list(userId);
    if (!items.length) return "No stored memory yet.";
    const byCategory = new Map<MemoryCategory, string[]>();
    for (const item of items) {
      const arr = byCategory.get(item.category) ?? [];
      arr.push(`${item.key}: ${item.value}`);
      byCategory.set(item.category, arr);
    }
    return Array.from(byCategory.entries())
      .map(([cat, lines]) => `${cat}:\n- ${lines.join("\n- ")}`)
      .join("\n\n");
  },
};
