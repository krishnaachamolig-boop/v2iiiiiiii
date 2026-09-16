import { env } from "@/lib/env";

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

/**
 * Web research abstraction. Never invents results — if no provider is
 * configured, it returns a clear "unavailable" state rather than fabricating
 * search results, per spec.
 */
export const webResearchService = {
  isConfigured(): boolean {
    return env.SEARCH_PROVIDER !== "none" && Boolean(env.SEARCH_API_KEY);
  },

  async search(query: string): Promise<{ available: boolean; results: SearchResult[]; reason?: string }> {
    if (!this.isConfigured()) {
      return {
        available: false,
        results: [],
        reason:
          "Web search is not configured. Set VITE_SEARCH_API_KEY and VITE_SEARCH_PROVIDER in .env to enable it.",
      };
    }

    if (env.SEARCH_PROVIDER === "brave") {
      const res = await fetch(`${env.SEARCH_API_URL}?q=${encodeURIComponent(query)}`, {
        headers: { "X-Subscription-Token": env.SEARCH_API_KEY, Accept: "application/json" },
      });
      if (!res.ok) {
        return { available: false, results: [], reason: `Search provider error ${res.status}` };
      }
      const data = await res.json();
      const results: SearchResult[] = (data.web?.results ?? []).map((r: any) => ({
        title: r.title,
        url: r.url,
        snippet: r.description ?? "",
      }));
      return { available: true, results };
    }

    return { available: false, results: [], reason: `Unsupported search provider: ${env.SEARCH_PROVIDER}` };
  },

  async fetchPage(url: string): Promise<{ available: boolean; text?: string; reason?: string }> {
    try {
      const res = await fetch(url);
      if (!res.ok) return { available: false, reason: `Fetch failed with status ${res.status}` };
      const text = await res.text();
      // Strip tags crudely for a plain-text preview; a production build should
      // use a proper HTML-to-text extractor (e.g. via a server-side function
      // to avoid CORS issues, which browser-side fetch will hit on many sites).
      const plain = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 5000);
      return { available: true, text: plain };
    } catch (err) {
      return { available: false, reason: `Fetch blocked (likely CORS): ${(err as Error).message}` };
    }
  },
};
