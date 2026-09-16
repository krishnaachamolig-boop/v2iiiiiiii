import { env } from "@/lib/env";

export interface MusicProject {
  id: string;
  title: string;
  status: "concept" | "writing" | "production" | "mixing" | "released";
  releaseDate?: string;
}

/**
 * Adapter for the future "Beginning Write" music-project product.
 * No public API exists yet. Song-concept and lyric GENERATION can run today
 * (that's just an AI text tool — see src/tools/registry.ts:
 * generate_song_concept) because it needs no external service. Everything
 * that would READ/WRITE a real Beginning Write project is gated behind
 * isConfigured() and reports unavailability honestly. Publishing a release
 * always requires CONFIRM permission (see registry) — never automatic.
 */
export const BeginningWriteService = {
  isConfigured(): boolean {
    return Boolean(env.BEGINNING_WRITE_ENDPOINT && env.BEGINNING_WRITE_API_KEY);
  },

  async listProjects(userId: string): Promise<{ available: boolean; projects: MusicProject[]; reason?: string }> {
    if (!this.isConfigured()) {
      return { available: false, projects: [], reason: "Beginning Write endpoint not configured." };
    }
    const res = await fetch(`${env.BEGINNING_WRITE_ENDPOINT}/projects?owner=${userId}`, {
      headers: { Authorization: `Bearer ${env.BEGINNING_WRITE_API_KEY}` },
    });
    if (!res.ok) return { available: false, projects: [], reason: `Beginning Write API error ${res.status}` };
    const data = await res.json();
    return { available: true, projects: data.projects ?? [] };
  },

  async updateProjectStatus(
    userId: string,
    projectId: string,
    status: MusicProject["status"]
  ): Promise<{ available: boolean; reason?: string }> {
    if (!this.isConfigured()) {
      return { available: false, reason: "Beginning Write endpoint not configured." };
    }
    const res = await fetch(`${env.BEGINNING_WRITE_ENDPOINT}/projects/${projectId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${env.BEGINNING_WRITE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status, updatedBy: userId }),
    });
    return res.ok ? { available: true } : { available: false, reason: `Update failed ${res.status}` };
  },
};
