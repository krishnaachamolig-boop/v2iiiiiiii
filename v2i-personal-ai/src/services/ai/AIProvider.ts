// ============================================================
// AIProvider abstraction — swap models/vendors without touching
// the rest of the app. Add new providers by implementing this
// interface and registering them in index.ts.
// ============================================================

export interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AIToolDefinition {
  name: string;
  description: string;
  input_schema: Record<string, unknown>; // JSON schema
}

export interface AIToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface AITextBlock {
  type: "text";
  text: string;
}

export type AIContentBlock = AITextBlock | AIToolUseBlock;

export interface AICompletionResult {
  content: AIContentBlock[];
  stopReason: "end_turn" | "tool_use" | "max_tokens" | "error";
  raw?: unknown;
}

export interface AICompletionRequest {
  messages: AIMessage[];
  system?: string;
  tools?: AIToolDefinition[];
  maxTokens?: number;
  onTextDelta?: (delta: string) => void; // streaming callback
  signal?: AbortSignal; // for interrupting generation
}

export interface AIProvider {
  readonly name: string;
  complete(request: AICompletionRequest): Promise<AICompletionResult>;
  isConfigured(): boolean;
}
