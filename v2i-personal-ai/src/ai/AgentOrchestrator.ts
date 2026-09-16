import { getAIProvider } from "@/services/ai";
import type { AIMessage, AIContentBlock } from "@/services/ai/AIProvider";
import { tools, getTool } from "@/tools/registry";
import { toAIToolDefinition } from "@/tools/types";
import { evaluatePermission, buildPendingAction, type UserPermissionOverrides } from "./PermissionSystem";
import { buildSystemPrompt } from "./systemPrompt";
import { memoryService } from "@/memory/memoryService";
import { activityService } from "@/services/activityService";
import type { PendingAction } from "@/types";

export interface AgentRunResult {
  finalText: string;
  pendingActions: PendingAction[]; // actions awaiting user confirmation
  executedTools: { name: string; input: unknown; output: unknown }[];
}

export interface AgentRunOptions {
  userId: string;
  userName: string;
  preferredLanguage: "hindi" | "english" | "hinglish";
  history: AIMessage[]; // prior conversation turns
  userMessage: string;
  overrides: UserPermissionOverrides;
  onTextDelta?: (delta: string) => void;
  signal?: AbortSignal;
}

const MAX_TOOL_ROUNDS = 5;

/**
 * The full AI Brain pipeline:
 * User Command → Intent (handled by the model via tool selection) → Plan →
 * Permission Check → Tool Selection → Tool Execution → Result →
 * Memory Update → AI Response.
 *
 * CONFIRM-level tools are never executed here — they are collected as
 * PendingActions and returned to the UI, which must call
 * executeApprovedAction() after explicit user approval.
 */
export async function runAgent(opts: AgentRunOptions): Promise<AgentRunResult> {
  const provider = getAIProvider();
  const memoryContext = await memoryService.buildContextSummary(opts.userId);
  const system = buildSystemPrompt({
    userName: opts.userName,
    preferredLanguage: opts.preferredLanguage,
    memoryContext,
    todayIso: new Date().toISOString(),
  });

  const messages: AIMessage[] = [...opts.history, { role: "user", content: opts.userMessage }];
  const pendingActions: PendingAction[] = [];
  const executedTools: AgentRunResult["executedTools"] = [];

  let finalText = "";

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const result = await provider.complete({
      messages,
      system,
      tools: tools.map(toAIToolDefinition),
      onTextDelta: round === 0 ? opts.onTextDelta : undefined, // only stream first pass live
      signal: opts.signal,
    });

    const textBlocks = result.content.filter((b): b is Extract<AIContentBlock, { type: "text" }> => b.type === "text");
    const toolBlocks = result.content.filter((b): b is Extract<AIContentBlock, { type: "tool_use" }> => b.type === "tool_use");

    finalText = textBlocks.map((b) => b.text).join("\n") || finalText;

    if (result.stopReason !== "tool_use" || toolBlocks.length === 0) {
      break; // model is done
    }

    // Append the assistant's tool-use turn to the running transcript
    messages.push({ role: "assistant", content: finalText || "(using tools)" });

    for (const call of toolBlocks) {
      const tool = getTool(call.name);
      if (!tool) {
        messages.push({ role: "user", content: `Tool "${call.name}" does not exist.` });
        continue;
      }

      const decision = evaluatePermission(tool.name, tool.permission, opts.overrides);

      if (decision.requiresConfirmation) {
        const pending = buildPendingAction(
          tool.name,
          call.input,
          decision.reason,
          tool.describeAffectedResource(call.input)
        );
        pendingActions.push(pending);
        messages.push({
          role: "user",
          content: `Tool "${call.name}" requires user confirmation and was NOT executed. It is queued for approval.`,
        });
        await activityService.log(opts.userId, `Queued for approval: ${tool.name}`, "pending", tool.name, call.input);
        continue;
      }

      try {
        const output = await tool.execute(call.input, { userId: opts.userId });
        executedTools.push({ name: tool.name, input: call.input, output });
        messages.push({ role: "user", content: `Tool "${call.name}" result: ${JSON.stringify(output).slice(0, 4000)}` });
        await activityService.log(opts.userId, `Executed ${tool.name}`, "success", tool.name, { input: call.input });
      } catch (err) {
        const message = (err as Error).message;
        messages.push({ role: "user", content: `Tool "${call.name}" failed: ${message}` });
        await activityService.log(opts.userId, `Failed ${tool.name}`, "failure", tool.name, {
          input: call.input,
          error: message,
        });
      }
    }
  }

  return { finalText, pendingActions, executedTools };
}

/** Called after the user explicitly approves a CONFIRM-level action from its card. */
export async function executeApprovedAction(
  userId: string,
  action: PendingAction
): Promise<{ output?: unknown; error?: string }> {
  const tool = getTool(action.tool);
  if (!tool) return { error: `Tool "${action.tool}" no longer exists.` };

  try {
    const output = await tool.execute(action.input, { userId });
    await activityService.log(userId, `Approved & executed ${tool.name}`, "success", tool.name, {
      input: action.input,
    });
    return { output };
  } catch (err) {
    const message = (err as Error).message;
    await activityService.log(userId, `Approved but failed ${tool.name}`, "failure", tool.name, {
      input: action.input,
      error: message,
    });
    return { error: message };
  }
}
