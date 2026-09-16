import { supabase } from "@/lib/supabase";
import type { FileRecord } from "@/types";

const BUCKET = "user-files";

export const filesService = {
  async upload(userId: string, file: File, projectId?: string | null): Promise<FileRecord> {
    const path = `${userId}/${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
      upsert: false,
    });
    if (uploadError) throw uploadError;

    const { data, error } = await supabase
      .from("files")
      .insert({
        user_id: userId,
        project_id: projectId ?? null,
        storage_path: path,
        file_name: file.name,
        mime_type: file.type || "application/octet-stream",
        size_bytes: file.size,
      })
      .select()
      .single();
    if (error) throw error;
    return data as FileRecord;
  },

  async list(userId: string, projectId?: string | null): Promise<FileRecord[]> {
    let query = supabase.from("files").select("*").eq("user_id", userId).order("created_at", {
      ascending: false,
    });
    if (projectId) query = query.eq("project_id", projectId);
    const { data, error } = await query;
    if (error) throw error;
    return data as FileRecord[];
  },

  async getSignedUrl(path: string, expiresInSeconds = 3600): Promise<string> {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresInSeconds);
    if (error) throw error;
    return data.signedUrl;
  },

  async saveSummary(userId: string, fileId: string, summary: string): Promise<FileRecord> {
    const { data, error } = await supabase
      .from("files")
      .update({ summary })
      .eq("id", fileId)
      .eq("user_id", userId)
      .select()
      .single();
    if (error) throw error;
    return data as FileRecord;
  },
};
