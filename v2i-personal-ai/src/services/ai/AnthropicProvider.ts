import type {
  AIProvider,
  AICompletionRequest,
  AICompletionResult,
  AIContentBlock,
} from "./AIProvider";
import { env } from "@/lib/env";

/**
 * Calls the Anthropic Messages API.
 *
 * SECURITY NOTE: calling api.anthropic.com directly from the browser exposes
 * VITE_ANTHROPIC_API_KEY to anyone who opens devtools. This is acceptable for
 * local development only. For production, set VITE_AI_PROXY=true and stand up
 * a thin server route (e.g. a Supabase Edge Function) at /api/ai/complete that
 * holds the real key server-side and forwards the same request/response shape
 * used below. This class already branches on that flag.
 */
export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";

  isConfigured(): boolean {
    return env.AI_PROXY ? true : Boolean(env.ANTHROPIC_API_KEY);
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResult> {
    if (!this.isConfigured()) {
      throw new Error(
        "Anthropic provider not configured: set VITE_ANTHROPIC_API_KEY (dev) or VITE_AI_PROXY=true with a server route."
      );
    }

    const endpoint = env.AI_PROXY
      ? "/api/ai/complete"
      : "https://api.anthropic.com/v1/messages";

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (!env.AI_PROXY) {
      headers["x-api-key"] = env.ANTHROPIC_API_KEY;
      headers["anthropic-version"] = "2023-06-01";
      headers["anthropic-dangerous-direct-browser-access"] = "true";
    }

    const body = {
      model: env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
      max_tokens: request.maxTokens ?? 2048,
      system: request.system,
      messages: request.messages,
      tools: request.tools,
      stream: Boolean(request.onTextDelta),
    };

    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: request.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Anthropic API error ${res.status}: ${text}`);
    }

    if (request.onTextDelta && res.body) {
      return this.consumeStream(res.body, request.onTextDelta);
    }

    const data = await res.json();
    return {
      content: data.content as AIContentBlock[],
      stopReason: this.mapStopReason(data.stop_reason),
      raw: data,
    };
  }

  private mapStopReason(reason: string): AICompletionResult["stopReason"] {
    if (reason === "tool_use") return "tool_use";
    if (reason === "max_tokens") return "max_tokens";
    return "end_turn";
  }

  private async consumeStream(
    body: ReadableStream<Uint8Array>,
    onDelta: (delta: string) => void
  ): Promise<AICompletionResult> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    const blocks: AIContentBlock[] = [];
    let currentText = "";
    let stopReason: AICompletionResult["stopReason"] = "end_turn";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const jsonStr = line.slice(5).trim();
        if (!jsonStr || jsonStr === "[DONE]") continue;
        try {
          const event = JSON.parse(jsonStr);
          if (event.type === "content_block_delta" && event.delta?.text) {
            currentText += event.delta.text;
            onDelta(event.delta.text);
          }
          if (event.type === "message_delta" && event.delta?.stop_reason) {
            stopReason = this.mapStopReason(event.delta.stop_reason);
          }
        } catch {
          // ignore malformed SSE chunk
        }
      }
    }

    if (currentText) blocks.push({ type: "text", text: currentText });
    return { content: blocks, stopReason };
  }
}
