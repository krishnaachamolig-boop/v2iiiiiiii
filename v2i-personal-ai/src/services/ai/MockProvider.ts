import type { AIProvider, AICompletionRequest, AICompletionResult } from "./AIProvider";

/**
 * Deterministic offline provider. Used automatically when no real provider
 * is configured, so the UI never silently pretends a real AI responded.
 * Every response is clearly labeled as a mock.
 */
export class MockProvider implements AIProvider {
  readonly name = "mock";

  isConfigured(): boolean {
    return true;
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResult> {
    const last = request.messages[request.messages.length - 1]?.content ?? "";
    const text = `[MOCK AI — no provider configured] I received: "${last.slice(
      0,
      200
    )}". Set VITE_ANTHROPIC_API_KEY in .env to get real responses.`;

    if (request.onTextDelta) {
      for (const chunk of text.split(" ")) {
        request.onTextDelta(chunk + " ");
        await new Promise((r) => setTimeout(r, 15));
      }
    }

    return {
      content: [{ type: "text", text }],
      stopReason: "end_turn",
    };
  }
}
