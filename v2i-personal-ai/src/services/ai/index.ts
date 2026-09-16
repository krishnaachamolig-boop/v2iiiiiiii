import type { AIProvider } from "./AIProvider";
import { AnthropicProvider } from "./AnthropicProvider";
import { MockProvider } from "./MockProvider";
import { env } from "@/lib/env";

export * from "./AIProvider";

let cached: AIProvider | null = null;

/** Returns the active AI provider based on env config, falling back to mock. */
export function getAIProvider(): AIProvider {
  if (cached) return cached;

  const providerName = env.AI_PROVIDER;
  let provider: AIProvider;

  switch (providerName) {
    case "anthropic":
      provider = new AnthropicProvider();
      break;
    case "mock":
      provider = new MockProvider();
      break;
    default:
      provider = new AnthropicProvider();
  }

  if (!provider.isConfigured()) {
    console.warn(
      `[AI] Provider "${provider.name}" is not configured. Falling back to MockProvider. ` +
        `Set the required env vars in .env to enable real responses.`
    );
    provider = new MockProvider();
  }

  cached = provider;
  return provider;
}
