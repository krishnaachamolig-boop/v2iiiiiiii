import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/lib/authStore";
import { useChatStore } from "@/lib/chatStore";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { useVoicePlayback } from "@/hooks/useVoicePlayback";
import { MicButton } from "@/components/voice/MicButton";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ConfirmationCard } from "@/components/chat/ConfirmationCard";
import { isSupabaseConfigured } from "@/lib/supabase";
import { ConfigWarning } from "@/components/common/ConfigWarning";
import type { UserPermissionOverrides } from "@/ai/PermissionSystem";

const NO_OVERRIDES: UserPermissionOverrides = { forceConfirm: new Set(), disabled: new Set() };

export default function Chat() {
  const { profile } = useAuthStore();
  const {
    messages,
    streamingText,
    isGenerating,
    pendingActions,
    send,
    interrupt,
    approveAction,
    denyAction,
  } = useChatStore();
  const { speak, stop: stopSpeaking, speaking } = useVoicePlayback();
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { status: voiceStatus, start: startVoice, stop: stopVoice } = useVoiceInput((text) => {
    if (text.trim()) submit(text);
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streamingText]);

  const submit = (text: string) => {
    if (!profile || !text.trim()) return;
    setDraft("");
    void send({
      userId: profile.id,
      userName: profile.name,
      preferredLanguage: profile.preferred_language,
      text,
      overrides: NO_OVERRIDES,
      onFinalText: (finalText) => {
        // Auto-play voice response so the loop (voice in -> voice out) feels natural.
        void speak(finalText);
      },
    });
  };

  return (
    <div className="flex h-full flex-col pt-4">
      {!isSupabaseConfigured() && (
        <div className="mb-3">
          <ConfigWarning message="Connect Supabase to save conversation history. Chat will still work in-memory for this session." />
        </div>
      )}

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto pb-3">
        {messages.length === 0 && (
          <p className="pt-10 text-center text-sm text-slate-500">
            Jarvis, kya pending hai? · Ask me anything, in Hindi, English, or Hinglish.
          </p>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} onSpeak={speak} />
        ))}
        {isGenerating && streamingText && (
          <MessageBubble
            message={{ id: "streaming", role: "assistant", content: streamingText, createdAt: "" }}
          />
        )}
        {pendingActions.map((action) => (
          <ConfirmationCard
            key={action.id}
            action={action}
            onApprove={() => profile && approveAction(profile.id, action.id)}
            onDeny={() => denyAction(action.id)}
          />
        ))}
      </div>

      <div className="space-y-3 border-t border-base-700 py-3">
        <div className="flex items-center gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit(draft)}
            placeholder="Type a command…"
            className="flex-1 rounded-full border border-base-700 bg-base-900 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-neon-cyan/60"
          />
          {isGenerating ? (
            <button
              onClick={interrupt}
              className="rounded-full bg-red-500/20 px-4 py-2.5 text-sm text-red-300 hover:bg-red-500/30"
            >
              Stop
            </button>
          ) : (
            <button
              onClick={() => submit(draft)}
              className="rounded-full bg-neon-cyan/20 px-4 py-2.5 text-sm text-neon-cyan hover:bg-neon-cyan/30"
            >
              Send
            </button>
          )}
          {speaking && (
            <button
              onClick={stopSpeaking}
              className="rounded-full border border-base-600 px-3 py-2.5 text-xs text-slate-300"
            >
              Mute
            </button>
          )}
        </div>

        <div className="flex justify-center pb-2 pt-1">
          <MicButton status={voiceStatus} onPress={startVoice} onRelease={stopVoice} size="md" />
        </div>
      </div>
    </div>
  );
}
