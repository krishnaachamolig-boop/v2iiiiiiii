import { create } from "zustand";
import { runAgent, executeApprovedAction } from "@/ai/AgentOrchestrator";
import type { AIMessage } from "@/services/ai/AIProvider";
import type { PendingAction } from "@/types";
import type { UserPermissionOverrides } from "@/ai/PermissionSystem";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface ChatState {
  messages: ChatMessage[];
  streamingText: string;
  isGenerating: boolean;
  pendingActions: PendingAction[];
  abortController: AbortController | null;
  send: (opts: {
    userId: string;
    userName: string;
    preferredLanguage: "hindi" | "english" | "hinglish";
    text: string;
    overrides: UserPermissionOverrides;
    onFinalText?: (text: string) => void;
  }) => Promise<void>;
  interrupt: () => void;
  approveAction: (userId: string, actionId: string) => Promise<void>;
  denyAction: (actionId: string) => void;
  clear: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  streamingText: "",
  isGenerating: false,
  pendingActions: [],
  abortController: null,

  async send({ userId, userName, preferredLanguage, text, overrides, onFinalText }) {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    const controller = new AbortController();
    set((s) => ({
      messages: [...s.messages, userMsg],
      isGenerating: true,
      streamingText: "",
      abortController: controller,
    }));

    const history: AIMessage[] = get().messages.map((m) => ({ role: m.role, content: m.content }));

    try {
      const result = await runAgent({
        userId,
        userName,
        preferredLanguage,
        history,
        userMessage: text,
        overrides,
        signal: controller.signal,
        onTextDelta: (delta) => set((s) => ({ streamingText: s.streamingText + delta })),
      });

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: result.finalText || "(no response)",
        createdAt: new Date().toISOString(),
      };

      set((s) => ({
        messages: [...s.messages, assistantMsg],
        streamingText: "",
        isGenerating: false,
        pendingActions: [...s.pendingActions, ...result.pendingActions],
        abortController: null,
      }));

      onFinalText?.(assistantMsg.content);
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        set({ isGenerating: false, abortController: null });
        return;
      }
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Error: ${(err as Error).message}`,
        createdAt: new Date().toISOString(),
      };
      set((s) => ({ messages: [...s.messages, errorMsg], isGenerating: false, abortController: null }));
    }
  },

  interrupt() {
    get().abortController?.abort();
  },

  async approveAction(userId, actionId) {
    const action = get().pendingActions.find((a) => a.id === actionId);
    if (!action) return;
    const { output, error } = await executeApprovedAction(userId, action);
    set((s) => ({
      pendingActions: s.pendingActions.filter((a) => a.id !== actionId),
      messages: [
        ...s.messages,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: error
            ? `Action "${action.tool}" failed: ${error}`
            : `Approved and completed "${action.tool}". ${JSON.stringify(output).slice(0, 300)}`,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
  },

  denyAction(actionId) {
    set((s) => ({ pendingActions: s.pendingActions.filter((a) => a.id !== actionId) }));
  },

  clear() {
    set({ messages: [], streamingText: "", pendingActions: [] });
  },
}));
