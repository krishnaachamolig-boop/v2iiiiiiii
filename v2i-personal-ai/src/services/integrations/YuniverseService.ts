import { env } from "@/lib/env";

export interface CreatorProject {
  id: string;
  title: string;
  status: "draft" | "editing" | "scheduled" | "published";
}

/**
 * Adapter for the future Yuniverse creator platform. No public API exists
 * yet, so every network method checks isConfigured() first. Metadata,
 * descriptions, and captions can be PREPARED by the AI locally (pure text
 * generation, no external call) — only actually publishing to Yuniverse
 * requires this service to be configured AND requires CONFIRM-level user
 * approval (see the publish_to_yuniverse tool in the registry).
 */
export const YuniverseService = {
  isConfigured(): boolean {
    return Boolean(env.YUNIVERSE_ENDPOINT && env.YUNIVERSE_API_KEY);
  },

  async listCreatorProjects(userId: string): Promise<{ available: boolean; projects: CreatorProject[]; reason?: string }> {
    if (!this.isConfigured()) {
      return { available: false, projects: [], reason: "Yuniverse endpoint not configured." };
    }
    const res = await fetch(`${env.YUNIVERSE_ENDPOINT}/projects?owner=${userId}`, {
      headers: { Authorization: `Bearer ${env.YUNIVERSE_API_KEY}` },
    });
    if (!res.ok) return { available: false, projects: [], reason: `Yuniverse API error ${res.status}` };
    const data = await res.json();
    return { available: true, projects: data.projects ?? [] };
  },

  async publish(
    userId: string,
    projectId: string,
    metadata: { title?: string; description?: string; captions?: string }
  ): Promise<{ available: boolean; reason?: string }> {
    if (!this.isConfigured()) {
      return { available: false, reason: "Yuniverse endpoint not configured." };
    }
    const res = await fetch(`${env.YUNIVERSE_ENDPOINT}/projects/${projectId}/publish`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.YUNIVERSE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...metadata, publishedBy: userId }),
    });
    return res.ok ? { available: true } : { available: false, reason: `Publish failed ${res.status}` };
  },
};
