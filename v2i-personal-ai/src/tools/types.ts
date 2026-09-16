import type { PermissionLevel } from "@/types";
import type { AIToolDefinition } from "@/services/ai/AIProvider";

export interface ToolContext {
  userId: string;
}

export interface ToolDefinition<TInput = any, TOutput = any> {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>; // JSON schema, also used as AI tool schema
  permission: PermissionLevel;
  /** affectedResource label generator, used for CONFIRM cards */
  describeAffectedResource: (input: TInput) => string;
  execute: (input: TInput, ctx: ToolContext) => Promise<TOutput>;
}

export function toAIToolDefinition(tool: ToolDefinition): AIToolDefinition {
  return {
    name: tool.name,
    description: tool.description,
    input_schema: tool.inputSchema,
  };
}
